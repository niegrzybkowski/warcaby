import json
from os import kill
import re
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from .models import GameRoom
from django.db.transaction import commit

class LobbyReadinessConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group_name = "lobby_%s" % self.room_name

        self.host_ready = False
        self.guest_ready = False
        self.countdown_started = False

        player = self.scope["session"]["player_name"]
        room = GameRoom.objects.get(pk = self.room_name)
        
        if room.host_player == player or room.guest_player == player:
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            self.accept()

            async_to_sync(self.channel_layer.group_send)(
                self.group_name, 
                {
                    'type': 'ready_change',
                    'ready': False,
                    'player': "white",
                    'reason': 'joined'

                }
            )

            async_to_sync(self.channel_layer.group_send)(
                self.group_name, 
                {
                    'type': 'ready_change',
                    'ready': False,
                    'player': "black",
                    'reason': 'joined'

                }
            )

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_send)(
            self.group_name, 
            {
                'type': 'ready_change',
                'ready': False,
                'player': "white",
                'reason': 'left'

            }
        )

        async_to_sync(self.channel_layer.group_send)(
            self.group_name, 
            {
                'type': 'ready_change',
                'ready': False,
                'player': "black",
                'reason': 'left'
            }
        )

        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

    def receive(self, text_data):
        room = GameRoom.objects.get(pk = self.room_name)

        ready = json.loads(text_data)['ready']
        player_name = self.scope["session"]["player_name"]
        player = ""
        if player_name == room.host_player:
            player = "white"
        elif player_name == room.guest_player:
            player = "black"

        async_to_sync(self.channel_layer.group_send)(
            self.group_name, 
            {
                'type': 'ready_change',
                'ready': ready,
                'player': player,
                'reason': 'button'
            }
        )
        
    
    def ready_change(self, event):
        # print(event)
        ready = event['ready']
        player = event['player']

        if player == "white":
            self.host_ready = ready
        else:
            self.guest_ready = ready
        
        # print(f"Host ready: {self.host_ready}, Guest ready: {self.guest_ready}")

        self.send(text_data=json.dumps({
                'ready': ready,
                'player': player
        }))

        if self.host_ready and self.guest_ready:
            self.countdown_started = True
            self.send(text_data=json.dumps({
                'countdown': True
            }))
            room = GameRoom.objects.get(pk = self.room_name)
            room.game_state = 'P'
            room.save()
        elif self.countdown_started and event['reason'] == 'button':
            self.countdown_started = False
            self.send(text_data=json.dumps({
                'countdown': False
            }))
            room = GameRoom.objects.get(pk = self.room_name)
            room.game_state = 'L'
            room.save()


class GameConsumer(WebsocketConsumer):
    def send_state(self):
        room = GameRoom.objects.get(pk = self.room_name)
        state = room.board_state_store.copy()
        player_name = self.scope["session"]["player_name"]
        player = ""
        if player_name == room.host_player:
            player = "white"
        elif player_name == room.guest_player:
            player = "black"

        state["configuration"]["controllable_sides"] = (
            [] if "winner" in state and state["winner"] is not None
            else ["white"] if player == "white" 
            else ["black"] if player == "black"
            else []
        )
        
        self.send(json.dumps({
                    'type': 'state',
                    'data': state
        }))

    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.group_name = "lobby_%s" % self.room_name

        player = self.scope["session"]["player_name"]
        room = GameRoom.objects.get(pk = self.room_name)

        if room.host_player == player or room.guest_player == player:
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            self.accept()
            # print("Player joined room %s, sending state" % self.room_name)
            self.send_state()

    def disconnect(self, code):
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

    def validate_turn(self, turn):
        room = GameRoom.objects.get(pk = self.room_name)
        simulation = room.board_state_store.copy()
        valid = self.is_side_valid(simulation, turn)
        valid &= self.is_at_least_one_action(simulation, turn)
        valid &= self.is_action_combination_valid(simulation, turn)
        try:
            self.apply_turn(simulation, turn)
        except Exception as e:
            print("failed turn validation")
            print(e)
            valid = False
        return valid
    
    def is_side_valid(self, simulation, turn):
        return turn["color"] == simulation["current_move"]

    def is_at_least_one_action(self, simulation, turn):
        return len(turn["actions"]) >= 1

    def is_action_combination_valid(self, simulation, turn):
        first_action_type = turn["actions"][0]["type"]
        if first_action_type == "kill":
            for action in turn["actions"]:
                if action["type"] != first_action_type:
                    return False
            return True
        else:
            return len(turn["actions"]) == 1        
    
    def apply_turn(self, board_state, turn):
        for action in turn["actions"]:
            if action["type"] == "kill":
                self.apply_kill_action(board_state, action)
            elif action["type"] == "move": 
                if board_state["fields"][action["from"]]["pawn"]["queen"]:
                    self.apply_queen_move_action(board_state, action)
                else:
                    self.apply_normal_move_action(board_state, action)
        board_state["current_move"] = "white" if board_state["current_move"] == "black" else "black"

    def apply_kill_action(self, board_state, kill_action):
        start_field = board_state["fields"][kill_action["from"]]
        killed_field = board_state["fields"][kill_action["kill"]]
        land_field = board_state["fields"][kill_action["to"]]
        current_move = board_state["current_move"]
        enemy_color = "white" if board_state["current_move"] == "black" else "black"
        from_row_idx, from_col_idx = kill_action["from"].split("_", 1)
        kill_row_idx, kill_col_idx = kill_action["kill"].split("_", 1)
        to_row_idx, to_col_idx = kill_action["to"].split("_", 1)
        # print(
        #     "apply_kill_selection",
        #     start_field["pawn"]["color"] == current_move,
        #     killed_field["pawn"]["color"] == enemy_color,
        #     ("pawn" not in land_field or land_field["pawn"] is None),
        #     abs(int(from_row_idx) - int(kill_row_idx)) == 1,
        #     abs(int(to_row_idx) - int(kill_row_idx)) == 1,
        #     abs(int(from_col_idx) - int(kill_col_idx)) == 1,
        #     abs(int(to_col_idx) - int(kill_col_idx)) == 1
        # )

        if (
            start_field["pawn"]["color"] == current_move and
            killed_field["pawn"]["color"] == enemy_color and
            ("pawn" not in land_field or land_field["pawn"] is None) and
            abs(int(from_row_idx) - int(kill_row_idx)) == 1 and
            abs(int(to_row_idx) - int(kill_row_idx)) == 1 and
            abs(int(from_col_idx) - int(kill_col_idx)) == 1 and
            abs(int(to_col_idx) - int(kill_col_idx)) == 1
        ):
            pawn = start_field["pawn"]
            board_state["fields"][kill_action["to"]]["pawn"] = pawn
            board_state["fields"][kill_action["from"]]["pawn"] = None
            board_state["fields"][kill_action["kill"]]["pawn"] = None
        else:
            raise Exception

    def apply_normal_move_action(self, board_state, move_action):
        start_field = board_state["fields"][move_action["from"]]
        land_field = board_state["fields"][move_action["to"]]
        current_move = board_state["current_move"]
        from_row_idx, from_col_idx = move_action["from"].split("_", 1)
        to_row_idx, to_col_idx = move_action["to"].split("_", 1)
        # debugger nie działa ffs 

        # print(
        #     "normal_move",
        #     start_field["pawn"]["color"] == current_move,
        #     ("pawn" not in land_field or land_field["pawn"] is None),
        #     abs(int(from_row_idx) - int(to_row_idx))== 1,
        #     abs(int(from_col_idx) - int(to_col_idx))== 1
        # )
        if (
            start_field["pawn"]["color"] == current_move and
            ("pawn" not in land_field or land_field["pawn"] is None) and
            abs(int(from_row_idx) - int(to_row_idx))== 1 and
            abs(int(from_col_idx) - int(to_col_idx))== 1
        ):
            pawn = start_field["pawn"]
            board_state["fields"][move_action["to"]]["pawn"] = pawn
            board_state["fields"][move_action["from"]]["pawn"] = None
        else:
            raise Exception
    
    def apply_queen_move_action(self, board_state, move_action):
        start_field = board_state["fields"][move_action["from"]]
        land_field = board_state["fields"][move_action["to"]]
        current_move = board_state["current_move"]
        from_row_idx_s, from_col_idx_s = move_action["from"].split("_", 1)
        to_row_idx_s, to_col_idx_s = move_action["to"].split("_", 1)
        from_row_idx, from_col_idx = int(from_row_idx_s), int(from_col_idx_s)
        to_row_idx, to_col_idx = int(to_row_idx_s), int(to_col_idx_s)
        direction_row = 1 if from_row_idx - to_row_idx < 0 else -1
        direction_col = 1 if from_col_idx - to_col_idx < 0 else -1
        
        if (
            start_field["pawn"]["color"] == current_move and
            ("pawn" not in land_field or land_field["pawn"] is None) and
            abs(from_row_idx - to_row_idx) == abs(from_col_idx - to_col_idx)
        ):
            
            for offset in range(1, abs(from_row_idx - to_row_idx), 1):
                # print(f"{from_row_idx + offset * direction_row}_{from_col_idx + offset * direction_col}")
                jumpover_field = board_state["fields"][f"{from_row_idx + offset * direction_row}_{from_col_idx + offset * direction_col}"]
                
                if "pawn" in jumpover_field and jumpover_field["pawn"] is not None:
                    raise Exception
            pawn = start_field["pawn"]
            board_state["fields"][move_action["to"]]["pawn"] = pawn
            board_state["fields"][move_action["from"]]["pawn"] = None
        else:
            raise Exception


    def check_queen_promotions(self, board_state):
        size = board_state["configuration"]["size"]
        for i in range(1, size+1):
            field_position_top = f"{1}_{i}"
            field_top = board_state["fields"][field_position_top]
            if "pawn" in field_top and field_top["pawn"] is not None and field_top["pawn"]["color"] == "white":
                field_top["pawn"]["queen"] = True

            field_position_bottom = f"{size}_{i}"
            field_bottom = board_state["fields"][field_position_bottom]
            if "pawn" in field_bottom and field_bottom["pawn"] is not None and field_bottom["pawn"]["color"] == "black":
                field_bottom["pawn"]["queen"] = True
    

    def check_victory(self, board_state):
        white_won = True
        black_won = True
        for _position, field in board_state["fields"].items():
            if "pawn" in field and field["pawn"] is not None:
                if field["pawn"]["color"] == "white":
                    black_won = False
                if field["pawn"]["color"] == "black":
                    white_won = False
            # print(_position, field)
            # print(white_won, white_won)

            if (not white_won) and (not black_won):
                break
        if white_won:
            return "white"
        elif black_won:
            return "black"
        else:
            return None



    def apply_turn_to_model(self, turn):
        room = GameRoom.objects.get(pk = self.room_name)
        board_state = room.board_state_store.copy()
        self.apply_turn(board_state, turn)
        self.check_queen_promotions(board_state)
        won = self.check_victory(board_state)
        #print(won)
        if won is not None:

            board_state["winner"] = won
            self.broadcast_game_over(won)
            room.game_state = 'O'
        room.board_state_store = board_state.copy()
        room.save()
    
    def broadcast_turn(self, turn):
        async_to_sync(self.channel_layer.group_send)(
            self.group_name, 
            {
                "type": "turn",
                "data": turn
            }
        )
    
    
    def broadcast_game_over(self, winner):
        #print("broadcasted_game_over")
        async_to_sync(self.channel_layer.group_send)(
            self.group_name, 
            {
                "type": "game_over",
                "data": {"winner": winner}
            }
        )

    def handle_turn(self, turn):
        if self.validate_turn(turn):
            self.apply_turn_to_model(turn)
            self.broadcast_turn(turn)
        else:
            self.send(json.dumps({'type': 'invalid_turn'}))

    def receive(self, text_data):
        message = json.loads(text_data)
        if message["type"] == "turn":
            self.handle_turn(message["data"])
        elif message["type"] == "request_state":
            self.send_state()


    def turn(self, event):
        self.send(text_data=json.dumps({
                'type': "turn",
                'data': event["data"]
        }))
    

    def game_over(self, event):
        self.send(text_data=json.dumps({
                'type': "game_over",
                'data': event["data"]
        }))