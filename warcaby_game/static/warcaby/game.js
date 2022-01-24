let bs;
let bc;
let start_of_game;
let turns = new Array;

window.onload = function() {
    let board_configuration = JSON.parse(document.getElementById("board_configuration").textContent);
    let online_configuration = JSON.parse(document.getElementById("online_configuration").textContent);
    board_configuration["controllable_sides"] = online_configuration["controllable_sides"];
    
    let socket_address = null;
    try {
        let room_name = JSON.parse(document.getElementById("room_name").textContent);
        socket_address ='ws://' + window.location.host + '/ws/game/' + room_name + '/';
    } catch (ignore) {}

    bs = new PersistentBoardState(
        board_configuration
    );
    start_of_game = bs.dump_state();
    let es = new EphemeralBoardState();
    let br = new BoardRenderer(
        bs,
        es,
        document.getElementById("game_board_container")
    );
    bc = new BoardController(
        bs,
        es,
        br,
        socket_address // connector
    );    
    bc.reload();
}

function idx_to_position (row_idx, column_idx) {
    return row_idx + "_" + column_idx;
}

function split_positon (position) {
    let [row_idx, column_idx] = position.split("_", 2);
    row_idx = Number(row_idx);
    column_idx = Number(column_idx);
    return [row_idx, column_idx];
}

class BoardConfiguration {
    /** @type {number} */
    size;
    /** @type {number} */
    starting_rows;
    /** @type {string} */
    starting_player;

    controllable_sides;
     
    /**
     * 
     * @param {number} size 
     * @param {number} starting_rows 
     * @param {string} starting_player 
     */
    constructor (size, starting_rows, starting_player, controllable_sides) {
        this.size = size;
        this.starting_rows = starting_rows;
        this.starting_player = starting_player;
        this.controllable_sides = controllable_sides;
    }

    static default_config = new BoardConfiguration(8, 3, "white", ["white", "black"]);
}

class Field {
    /**
     * Board field / tile, is either black or white, and can contain a pawn.
     */

    /** @type {string} */ color;
    /** @type {Pawn} */ pawn;
    constructor (color) {
        this.color = color;
    }
}

class Pawn {
    /**
     * 
     */

    /** @type {string} */ color;
    /** @type {boolean} */ queen = false;
    constructor (color) {
        this.color = color;
    }
}

class PersistentBoardState {
    /**
     * This class contains the serializable state of the game
    */

    /** @type {BoardConfiguration} */
    configuration;
    /** @type {Object.<string, Field>} */
    fields;
    /** @type {string} */
    current_move;
    /** @type {Object} */
    last_move;
    /** @type {string} */
    winner;
    /** @type {number} */
    turn_number = 0;

    constructor(configuration) {
        this.configuration = configuration;
        this.initialize_board_state();
    }

    /**
     * Iterate over all fields and apply callable
     * @param {Function} callable 
     */
    for_each_field (callable) {
        let size = this.configuration.size;

        for (let row_idx = 1; row_idx <= size; row_idx++) {
            for (let column_idx = 1; column_idx <= size; column_idx++) {
                callable(row_idx, column_idx, this.fields[row_idx + "_" + column_idx]);
            }
        }
    }

    for_each_pawn (callable) {
        this.for_each_field((row_idx, column_idx, field) => {
            if (field.pawn) {
                callable(row_idx, column_idx, field.pawn);
            }
        });
    }

    switch_current_move () {
        this.turn_number += 1;
        if (this.current_move == "black") {
            this.current_move = "white";
        } else {
            this.current_move = "black";
        }
    }

    get_pawn_at (row_idx, column_idx) {
        if (this.fields[idx_to_position(row_idx, column_idx)]) {
            return this.fields[idx_to_position(row_idx, column_idx)].pawn
        }
    }

    set_pawn_at (row_idx, column_idx, new_pawn) {
        if (this.fields[idx_to_position(row_idx, column_idx)]) {
            this.fields[idx_to_position(row_idx, column_idx)].pawn = new_pawn;
        }
    }

    get_field_at (row_idx, column_idx) {
        return this.fields[idx_to_position(row_idx, column_idx)];
    }

    is_game_over () {
        if (this.winner == null) {
            return true;
        }
        else {
            return false;
        }
    }

    move_pawn (from_row_idx, from_column_idx, to_row_idx, to_column_idx) {
        let pawn = this.get_pawn_at(from_row_idx, from_column_idx);

        this.set_pawn_at(to_row_idx, to_column_idx, pawn);
        this.set_pawn_at(from_row_idx, from_column_idx, null);
    }

    kill_pawn (kill_row_idx, kill_column_idx) {
        this.set_pawn_at(kill_row_idx, kill_column_idx, null);
    }

    /**
     * Initialization functions
     */

    initialize_board_state() {
        this.current_move = this.configuration.starting_player;
        this.initialize_fields();
        this.initialize_pawns();
    }

    initialize_fields () {
        let size = this.configuration.size;
        this.fields = {};

        for (let row_idx = 1; row_idx <= size; row_idx++) {
            for (let column_idx = 1; column_idx <= size; column_idx++) {
                let color = (row_idx+column_idx) % 2 == 0 ? "white" : "black";
    
                this.fields[row_idx + "_" + column_idx] = new Field(color);
            }
        }
    }

    initialize_pawns () {
        let starting_rows = this.configuration.starting_rows;
        let size = this.configuration.size;

        this.for_each_field((row_idx, _, field) => {
            if (field.color == "black") {
                if (row_idx <= starting_rows) {
                    field.pawn = new Pawn("black");
                } else if (row_idx > size - starting_rows) {
                    field.pawn = new Pawn("white");
                }
            }
        });
    }

    /** 
     * State I/O functions 
     */

    validate_incoming_state (new_state) {
        return "configuration" in new_state &&
               "fields" in new_state && 
               "current_move" in new_state;
    }

    load_state (serialized_state) {
        let new_state = JSON.parse(serialized_state);
        if (this.validate_incoming_state(new_state)) {
            this.configuration = new_state.configuration;
            this.fields = new_state.fields;
            this.current_move = new_state.current_move;
            this.winner = new_state.winner;
        }
        else {
            console.error("Tried loading invalid state");
        }
    }

    dump_state () {
        return JSON.stringify(this);
    }
}

class EphemeralBoardState {
    /**
     * Any game state that doesn't need to be known by the backend
     */

    /** @type {Object.<string, null>} */ selectable_pawns;
    /** @type {string} */ selected_pawn;
    /** @type {Object.<string, null>} */ legal_moves;
    /** @type {Object.<string, string>} */ killing_moves;
    
    constructor () {
        this.selectable_pawns = {};
        this.selected_pawn = null;
        this.legal_moves = {};
        this.killing_moves = {};
    }

    clear () {
        this.selectable_pawns = {};
        this.selected_pawn = null;
        this.legal_moves = {};
        this.killing_moves = {};
    }

    get_selected_idx () {
        return split_positon(this.selected_pawn);
    }
}

class BoardRenderer {
    /**
     * Render internal state in DOM
     */

    /** @type {PersistentBoardState} */ persistent_board_state;
    /** @type {EphemeralBoardState} */ ephemeral_board_state;

    /** @type {HTMLElement} */ container;
    /** @type {HTMLElement} */ game_information;
    /** @type {HTMLElement} */ table;
    /** @type {Array.<HTMLElement>} */ rows = [];
    /** @type {Object.<string, Node>} */ cells = {};
    /** @type {Object.<string, Node>} */ pawns = {};
    /** @type {Object<string, Node>} */ legal_move_indicators = {};

    constructor(persistent_board_state, ephemeral_board_state, container) {
        this.persistent_board_state = persistent_board_state;
        this.ephemeral_board_state = ephemeral_board_state;
        this.container = container;
    }

    /**
     * Rendering functions, these (re)create the DOM representation of the board
     */
    render () {
        this.clear();
        this.render_info();
        this.render_table();
        this.render_ephemeral();

        console.log("Done Rendering");
    }

    clear () {
        this.container.innerHTML = "";
        this.game_information = null;
        this.table = null;
        this.rows = [];
        this.cells = {};
        this.pawns = {};
        this.legal_move_indicators = {};
    }

    render_info () {
        let info_container = document.createElement("div");
        this.game_information = info_container;
        this.container.appendChild(info_container);

        this.render_config();
        if (this.persistent_board_state.winner) {
            this.render_winner();
        } 
        else {
            this.render_current_move();
        }
    }

    render_config () {
        let paragraph = document.createElement("p");
        paragraph.appendChild(document.createTextNode(
            "Current configuration:"
        ));

        let settings_list = document.createElement("ul");
        for (let [setting, value] of Object.entries(this.persistent_board_state.configuration)) {
            let setting_item = document.createElement("li");
            setting_item.appendChild(document.createTextNode(
                setting + ": " + value
            ));
            settings_list.appendChild(setting_item);
        }
        
        this.game_information.appendChild(paragraph);
        this.game_information.appendChild(settings_list);
    }

    render_winner () {
        let paragraph = document.createElement("p");
        paragraph.appendChild(document.createTextNode(
            "The winner is " + this.persistent_board_state.winner + "!"
        ));
        this.game_information.appendChild(paragraph);
    }

    render_current_move () {
        let paragraph = document.createElement("p");
        paragraph.appendChild(document.createTextNode(
            "Now moving: " + this.persistent_board_state.current_move
        ));
        this.game_information.appendChild(paragraph);
    }

    render_table () {
        let table = document.createElement("table");
        table.setAttribute("id", "game_board_table");
        this.table = table;
        this.container.appendChild(table);

        this.render_rows();
        this.render_headers();
        this.render_fields();
        this.render_pawns();
    }

    render_rows () {
        let size = this.persistent_board_state.configuration.size;

        for (let row_idx = 0; row_idx <= size; row_idx++) {
            let row = document.createElement("tr");
            this.rows.push(row);
            this.table.appendChild(row);
        }
    }

    render_headers () {
        let size = this.persistent_board_state.configuration.size;
        let rows = this.rows;
        
        //First row
        for (let column_idx = 0; column_idx <= size; column_idx++) {
            let el =  document.createElement("th");
            el.appendChild(document.createTextNode(column_idx));
            rows[0].appendChild(el);
        }

        //Subsequent rows
        for (let row_idx = 1; row_idx <= size; row_idx++) {
            let el =  document.createElement("th");
            el.appendChild(document.createTextNode(row_idx));
            rows[row_idx].appendChild(el);
        }
    }

    render_fields () {
        this.persistent_board_state.for_each_field((row_idx, column_idx, field) => {
            let table_cell = document.createElement("td");
            table_cell.setAttribute("id", "field_at_" + row_idx + "_" + column_idx);

            if (field.color == "white") {
                table_cell.setAttribute("class", "field-white");
            }
            else {
                table_cell.setAttribute("class", "field-black");
            }
            
            this.cells[row_idx + "_" + column_idx] = table_cell;
            this.rows[row_idx].appendChild(table_cell);
        });
    }

    render_pawns () {
        this.persistent_board_state.for_each_pawn((row_idx, column_idx, pawn) => {
            let pawn_button = document.createElement("button");
            
            if (pawn.queen) {
                pawn_button.innerHTML = "Q"; // TODO: Proper styling
            }

            if (pawn.color == "white") {
                pawn_button.setAttribute("class", "pawn-white");
            }
            else {
                pawn_button.setAttribute("class", "pawn-black");
            }

            this.cells[row_idx + "_" + column_idx].appendChild(pawn_button);
            this.pawns[row_idx + "_" + column_idx] = pawn_button;
        });
    }

    render_ephemeral () {
        this.render_selected();
        this.render_legal_moves();
        this.render_killing_moves();
    }

    render_selected () {
        let position = this.ephemeral_board_state.selected_pawn;
        if (position) {
            let targeted_field_dom = this.pawns[position];
            let target_color = this.persistent_board_state.fields[position].pawn.color;

            targeted_field_dom.setAttribute("class", "pawn-" + target_color + "-selected")            
        }
    }

    render_moves (move_dictionary) {
        for (let [move_position, _value] of Object.entries(move_dictionary)) {
            let legal_move_indicator = document.createElement("button");
            legal_move_indicator.setAttribute("class", "possible-move");

            this.legal_move_indicators[move_position] = legal_move_indicator;
            this.cells[move_position].appendChild(legal_move_indicator);
        }
    }

    render_legal_moves () {
        this.render_moves(this.ephemeral_board_state.legal_moves);
    }

    render_killing_moves () {
        this.render_moves(this.ephemeral_board_state.killing_moves);
    }

    /**
     * Callback installation functions
     */

    install_pawn_callback(row_idx, column_idx, callback) {
        if (this.pawns[idx_to_position(row_idx, column_idx)]) {
            this.pawns[idx_to_position(row_idx, column_idx)].onclick = callback;
        } else {
            console.error("Tried installing callback on non-existent pawn!");
        }
    }

    install_move_indicator_callback(row_idx, column_idx, callback) {
        if (this.legal_move_indicators[idx_to_position(row_idx, column_idx)]) {
            this.legal_move_indicators[idx_to_position(row_idx, column_idx)].onclick = callback;
        } else {
            console.error("Tried installing callback on non-existent legal move indicator!");
        }
    }
}

class MoveFinder {
    /**
     * Utility class for managing ephemeral state - finding moves
     */

    persistent_board_state;
    ephemeral_board_state;

    constructor (persistent_board_state, ephemeral_board_state) {
        this.persistent_board_state = persistent_board_state;
        this.ephemeral_board_state = ephemeral_board_state;
    }

    find_moves () {
        let [row_idx, column_idx] = split_positon(this.ephemeral_board_state.selected_pawn);
        let pawn = this.persistent_board_state.get_pawn_at(row_idx, column_idx);
        if (pawn) {
            if (pawn.queen) {
                this.find_queen_moves(row_idx, column_idx);
            }
            else {
                this.find_simple_moves(row_idx, column_idx);     
            }
            this.find_kill_moves(row_idx, column_idx);
        }
    }

    can_kill_chain () {
        if (Object.keys(this.ephemeral_board_state.killing_moves).length != 0) {
            return true;
        }
        else {
            return false;
        }
    }

    is_field_empty_and_legal (row_idx, column_idx) {
        if (!this.persistent_board_state.get_field_at(row_idx, column_idx)) {
            return false; // Out of bounds
        }
        if (this.persistent_board_state.get_pawn_at(row_idx, column_idx)) {
            return false; // Pawn present
        }
        return true; // Empty and legal
    }

    simple_check_and_set (row_idx, column_idx) {
        if (this.is_field_empty_and_legal(row_idx, column_idx)) {
            this.ephemeral_board_state.legal_moves[row_idx + "_" + column_idx] = true;
        }
    }

    find_simple_moves (row_idx, column_idx) {
        if (this.persistent_board_state.current_move == "white") {
            this.simple_check_and_set(row_idx - 1, column_idx + 1);
            this.simple_check_and_set(row_idx - 1, column_idx - 1);
        } else if (this.persistent_board_state.current_move == "black"){
            this.simple_check_and_set(row_idx + 1, column_idx + 1);
            this.simple_check_and_set(row_idx + 1, column_idx - 1);
        }
    }

    slide_while_legal (from_row_idx, from_column_idx, direction_row, direction_column) {
        let size = this.persistent_board_state.configuration.size;
        let current_row_idx = from_row_idx + direction_row;
        let current_column_idx = from_column_idx + direction_column;

        while (
            1 <= current_row_idx    && current_row_idx    <= size &&
            1 <= current_column_idx && current_column_idx <= size 
            ) {
            // if there is a pawn in the way, stop scanning
            if (this.persistent_board_state.get_pawn_at(current_row_idx, current_column_idx)) {
                break;
            }

            this.simple_check_and_set(current_row_idx, current_column_idx);
            current_row_idx += direction_row;
            current_column_idx += direction_column;
        }
    }

    find_queen_moves (row_idx, column_idx) {
        this.slide_while_legal(row_idx, column_idx,  1,  1);
        this.slide_while_legal(row_idx, column_idx,  1, -1);
        this.slide_while_legal(row_idx, column_idx, -1,  1);
        this.slide_while_legal(row_idx, column_idx, -1, -1);
    }

    is_field_contains_enemy (row_idx, column_idx) {
        let enemy_pawn = this.persistent_board_state.get_pawn_at(row_idx, column_idx);
        if (enemy_pawn) {
            return this.persistent_board_state.current_move != enemy_pawn.color;
        }
        return false
    }

    kill_check_and_set (enemy_row_idx, enemy_column_idx, landing_row_idx, landing_column_idx) {
        let kill_legal = this.is_field_contains_enemy(enemy_row_idx, enemy_column_idx);
        let landing_legal = this.is_field_empty_and_legal(landing_row_idx, landing_column_idx);

        if (kill_legal && landing_legal) {
            this.ephemeral_board_state.killing_moves[
                idx_to_position(landing_row_idx, landing_column_idx)
            ] = idx_to_position(enemy_row_idx, enemy_column_idx);
        }
    }

    find_kill_moves(row_idx, column_idx) {
        this.kill_check_and_set(row_idx + 1, column_idx + 1, row_idx + 2, column_idx + 2);
        this.kill_check_and_set(row_idx - 1, column_idx + 1, row_idx - 2, column_idx + 2);
        this.kill_check_and_set(row_idx + 1, column_idx - 1, row_idx + 2, column_idx - 2);
        this.kill_check_and_set(row_idx - 1, column_idx - 1, row_idx - 2, column_idx - 2);
    }
}

class MoveAction {
    type = "move";
    from;
    to;

    constructor (from, to) {
        this.from = from;
        this.to = to;
    }

    static from_idx (from_row_idx, from_column_idx, to_row_idx, to_column_idx) {
        return new MoveAction (
            idx_to_position(from_row_idx, from_column_idx),
            idx_to_position(to_row_idx, to_column_idx));
    }

    apply (persistent_board_state) {
        let [from_row_idx, from_column_idx] = split_positon(this.from);
        let [to_row_idx, to_column_idx] = split_positon(this.to);
        persistent_board_state.move_pawn(from_row_idx, from_column_idx, to_row_idx, to_column_idx);
    }

    validate (simulator) {
        return this.to in simulator.ephemeral_board_state.legal_moves;
    }
}

class KillAction {
    type = "kill";
    from;
    kill;
    to;

    constructor (from, kill, to) {
        this.from = from;
        this.kill = kill;
        this.to = to;
    }

    static from_idx (from_row_idx, from_column_idx, kill_row_idx, kill_column_idx, to_row_idx, to_column_idx) {
        return new KillAction (
            idx_to_position(from_row_idx, from_column_idx),
            idx_to_position(kill_row_idx, kill_column_idx),
            idx_to_position(to_row_idx, to_column_idx));
    }

    apply (persistent_board_state) {
        let [from_row_idx, from_column_idx] = split_positon(this.from);
        let [to_row_idx, to_column_idx] = split_positon(this.to);
        persistent_board_state.move_pawn(from_row_idx, from_column_idx, to_row_idx, to_column_idx);

        let [kill_row_idx, kill_column_idx] = split_positon(this.kill);
        persistent_board_state.kill_pawn(kill_row_idx, kill_column_idx);
    }

    validate (simulator) {
        return this.to in simulator.ephemeral_board_state.killing_moves;
    }
}

class Turn {
    color;
    actions;
    id;

    static new_blank (color, id) {
        let turn = new Turn;
        turn.color = color;
        turn.actions = new Array;
        turn.id = id;
        return turn;
    }

    static from_JSON (turn_data) {
        let turn = new Turn;
        turn.color = turn_data.color;
        turn.actions = new Array;
        for (let action of turn_data.actions) {
            let parsed_action;
            if (action.type == "move") {
                parsed_action = new MoveAction(action.from, action.to);
            } else if (action.type == "kill") {
                parsed_action = new KillAction(action.from, action.kill, action.to);
            } else {
                console.error("Incorrect action type");
            }
            turn.actions.push(parsed_action);
        }
        turn.id = turn_data.id;
        return turn;
    }
}

/**
 * zwykły
 * '{"id": 13, "color":"white","actions":[{"type":"move","from":"6_5","to":"5_4"}]}'
 * bicie
 * '{"id": 13, "color":"black","actions":[{"type":"kill","from":"2_1","kill":"3_2","to":"4_3"},{"type":"kill","from":"4_3","kill":"5_4","to":"6_5"}]}'
 * damka
 * '{"id": 13, "color":"white","actions":[{"type":"move","from":"1_4","to":"4_1"}]}'
 */

class TurnManager {
    /**
     * Validates, stores, applies turns
     */

    persistent_board_state;

    move_simulator;
    simulated_ephemeral_state;
    simulated_persistent_state;

    pending_turn;
    start_of_turn_state;

    constructor (persistent_board_state) {
        this.persistent_board_state = persistent_board_state;
        this.simulated_ephemeral_state = new EphemeralBoardState();
        this.simulated_persistent_state = new PersistentBoardState(persistent_board_state.configuration)
        this.move_simulator = new MoveFinder(this.simulated_persistent_state, this.simulated_ephemeral_state);
    }

    add_and_apply_action (action) {
        this.add_action_to_pending_turn(action);
        action.apply(this.persistent_board_state);
    }

    // apply - to PersistentBoardState
    // add   - to pending_turn

    apply_turn (turn) {
        for (let action of turn.actions) {
            action.apply(this.persistent_board_state);
        }
        this.persistent_board_state.switch_current_move();
    }

    init_turn () {
        this.pending_turn = Turn.new_blank(
            this.persistent_board_state.current_move,
            this.persistent_board_state.turn_number + 1
        );
    }

    add_action_to_pending_turn (action) {
        if (!this.pending_turn) {
            this.init_turn();
        }
        this.pending_turn.actions.push(action);
    }

    init_simulation () {
        this.simulated_persistent_state.load_state(this.persistent_board_state.dump_state());
        this.simulated_ephemeral_state.clear();
    }

    is_turn_valid (turn) {
        this.init_simulation();
        return this.is_side_valid(turn.color) &&
            this.is_at_least_one_action(turn.actions) &&
            this.is_action_combination_valid(turn.actions) &&
            this.is_all_actions_valid(turn.actions);
    }

    is_side_valid (turn_move) {
        return turn_move == this.simulated_persistent_state.current_move;
    }

    is_at_least_one_action (actions) {
        return actions.length >= 1;
    }

    is_action_combination_valid (actions) {
        let first_action_type = actions[0].type;
        if (first_action_type == "kill") {
            for (let action of actions){
                if (action.type != first_action_type) {
                    return false;
                }
            }
        }
        return actions.length;
    }

    is_all_actions_valid (actions) {
        for (let action of actions) {
            if (this.is_action_valid(action)) {
                action.apply(this.simulated_persistent_state);
            } 
            else {
                return false;
            }
        }
        return true;
    }

    is_action_valid (action) {
        this.simulated_ephemeral_state.selected_pawn = action.from;
        this.move_simulator.find_moves();
        return action.validate(this.move_simulator);
    }

    /**
     * Backup management
     */

    backup_state () {
        this.start_of_turn_state = this.persistent_board_state.dump_state();
    }

    restore_state () {
        this.persistent_board_state.load_state(this.start_of_turn_state);
    }

    load_remote_state (state_data_object) {
        let serialized_state = JSON.stringify(state_data_object);
        this.persistent_board_state.load_state(serialized_state);
    }
}

class SocketConnector {
    socket_address;
    socket;
    turn_manager;
    action_callback;

    constructor (socket_address, turn_manager, action_callback) {
        this.socket_address = socket_address;
        this.socket = new WebSocket(this.socket_address);
        this.socket.onclose = this.retry_connect.bind(this);
        this.socket.onerror = this.retry_connect.bind(this);
        this.socket.onmessage = this.handle_message.bind(this);
        this.turn_manager = turn_manager;
        this.action_callback = action_callback;
    }

    retry_connect () {
        console.error('Chat socket closed unexpectedly, reloading site');
        // console.log(this);
        setTimeout(() => {location.reload()}, 5000);
    }

    handle_message (event) {
        let message = JSON.parse(event.data);
        console.log(message);
        if (message["type"] == "turn") {
            try {
                let turn = Turn.from_JSON(message["data"]);
                this.handle_turn(turn);
            } catch (e) {
                console.log(e)
                console.error("Recieved malformed turn, requesting state")
                this.send_request_state();
            }
        } 
        else if (message["type"] == "state") {
            this.handle_state(message["data"]);
        } 
        else if (message["type"] == "invalid_turn"){
            console.error("Server-side validation failed, requesting state")
            this.send_request_state();
        }
        else if (message["type"] == "game_over") {
            this.handle_game_over(message["data"]["winner"])
        }
        this.action_callback(); 
    }

    handle_turn (turn) {
        if (this.turn_manager.is_turn_valid(turn)) {
            this.turn_manager.apply_turn(turn);
        }
        else  {
            console.error("Recieved invalid turn, requesting state")
            this.send_request_state();
        }

    }

    handle_state (state) {
        this.turn_manager.load_remote_state(state);
    }

    handle_game_over (winner) {
        this.turn_manager.persistent_board_state.winner = winner;
    }

    send_request_state () {
        this.send_message({
            "type": "request_state"
        });
    }

    send_turn (turn) {
        this.send_message({
            "type": "turn",
            "data": turn
        });
    }

    send_message (message) {
        this.socket.send(JSON.stringify(message));
    }
}


class BoardController {
    /**
     * Game logic
     */

    /** @type {PersistentBoardState} */ persistent_board_state;
    /** @type {EphemeralBoardState} */ ephemeral_board_state;
    /** @type {BoardRenderer} */ board_renderer;
    /** @type {MoveFinder} */ move_finder;
    /** @type {TurnManager} */ turn_manager;
    /** @type {SocketConnector} */ socket_connector;
    /** @type {boolean} */ is_local;

    constructor (persistent_board_state, ephemeral_board_state, board_renderer, socket_address) {
        this.persistent_board_state = persistent_board_state;
        this.ephemeral_board_state = ephemeral_board_state;
        this.board_renderer = board_renderer;
        this.move_finder = new MoveFinder(persistent_board_state, ephemeral_board_state);
        this.turn_manager = new TurnManager(persistent_board_state);
        if (socket_address) {
            this.socket_connector = new SocketConnector(
                socket_address,
                this.turn_manager,
                this.recieve_online_action.bind(this)
            );
            this.is_local = false;
        }
        else {
            this.is_local = true;
        }
    }

    reload () {
        this.board_renderer.render();
        this.install_all_callbacks();
    }

    install_all_callbacks() {
        let controller = this;

        this.install_select_callbacks(controller);
        this.install_move_callbacks(controller);
        this.install_kill_callbacks(controller);
    }

    install_select_callbacks(controller) {
        controller.persistent_board_state.for_each_pawn((row_idx, column_idx, pawn) => {
            controller.board_renderer.install_pawn_callback(row_idx, column_idx, () => {
                controller.select_pawn(row_idx, column_idx);
                controller.reload();
            });
        });
    }

    install_select_revert_callbacks(controller) {
        let [row_idx, column_idx] = split_positon(controller.ephemeral_board_state.selected_pawn);
        controller.board_renderer.install_pawn_callback(row_idx, column_idx, () => {
            controller.select_revert_pawn(row_idx, column_idx);
            controller.reload();
        });
    }

    install_move_callbacks(controller) {
        for (let [position, _value] of Object.entries(controller.ephemeral_board_state.legal_moves)) {
            let [row_idx, column_idx] = split_positon(position);
            controller.board_renderer.install_move_indicator_callback(row_idx, column_idx, () => {
                controller.move_pawn_to(row_idx, column_idx);
                controller.reload();
            });
        }
    }

    install_kill_callbacks (controller) {
        for (let [landing, enemy] of Object.entries(controller.ephemeral_board_state.killing_moves)) {
            let [landing_row_idx, landing_column_idx] = split_positon(landing); 
            let [enemy_row_idx, enemy_column_idx] = split_positon(enemy);

            controller.board_renderer.install_move_indicator_callback(landing_row_idx, landing_column_idx, () => {
                
                controller.kill_pawn(enemy_row_idx, enemy_column_idx, landing_row_idx, landing_column_idx);
                controller.board_renderer.render();
                if (controller.move_finder.can_kill_chain()) {
                    controller.install_kill_callbacks(controller);
                    controller.install_select_revert_callbacks(controller);
                } else {
                    controller.install_all_callbacks();
                }
            });
        }
    }

    select_pawn(row_idx, column_idx) {
        let position = idx_to_position(row_idx, column_idx);

        this.turn_manager.backup_state();
        this.turn_manager.init_turn();

        let pawn = this.persistent_board_state.get_pawn_at(row_idx, column_idx);
        
        if (pawn.color != this.persistent_board_state.current_move) {
            return;
        }
        if (!this.persistent_board_state.configuration.controllable_sides.includes(pawn.color)){
            console.log("cant control this one")
            return;
        }
        if (this.ephemeral_board_state.selected_pawn == position) {
            this.ephemeral_board_state.clear(); // clicked on an already selected pawn -> deselect
        }
        else {
            this.ephemeral_board_state.clear(); // normal selection
            this.ephemeral_board_state.selected_pawn = position;
            this.move_finder.find_moves();
        }
    }

    select_revert_pawn (row_idx, column_idx) { // click on selected pawn while kill chaining to abort move
        let position = idx_to_position(row_idx, column_idx);
        if (this.ephemeral_board_state.selected_pawn == position) {
            this.turn_manager.restore_state();
            this.ephemeral_board_state.clear();
        }
    }

    move_pawn_to (move_row_idx, move_column_idx) {
        let [selected_row_idx, selected_column_idx] = split_positon(this.ephemeral_board_state.selected_pawn);
        let action = MoveAction.from_idx(selected_row_idx, selected_column_idx, move_row_idx, move_column_idx);
        this.turn_manager.add_and_apply_action(action);
        this.end_turn();
    }

    kill_pawn (pawn_row_idx, pawn_column_idx, landing_row_idx, landing_column_idx) {
        let [selected_row_idx, selected_column_idx] = this.ephemeral_board_state.get_selected_idx();

        let action = KillAction.from_idx(
            selected_row_idx, selected_column_idx,
            pawn_row_idx, pawn_column_idx, 
            landing_row_idx, landing_column_idx
        );

        this.turn_manager.add_and_apply_action(action);

        this.ephemeral_board_state.clear();
        this.ephemeral_board_state.selected_pawn = idx_to_position(landing_row_idx, landing_column_idx);
        this.move_finder.find_kill_moves(landing_row_idx, landing_column_idx);

        if (!this.move_finder.can_kill_chain()) {
            this.end_turn();
        }
    }

    queen_promotion_check () {
        let size = this.persistent_board_state.configuration.size;
        for (let column_idx = 1; column_idx <= size; column_idx += 1) {
            let top_pawn = this.persistent_board_state.get_pawn_at(1, column_idx);
            if (top_pawn && top_pawn.color == "white") {
                top_pawn.queen = true;
            }
            let bottom_pawn = this.persistent_board_state.get_pawn_at(size, column_idx);
            if (bottom_pawn && bottom_pawn.color == "black") {
                bottom_pawn.queen = true;
            }
        }
    }

    victory_check () {
        let is_black_winner = true;
        let is_white_winner =  true;

        this.persistent_board_state.for_each_pawn((_r, _c, pawn) => {
            if (pawn.color == "white") {
                is_black_winner = false;
            }
            if (pawn.color == "black") {
                is_white_winner = false;
            }
        });
        if (is_white_winner) {
            this.persistent_board_state.winner = "white";
        } 
        if (is_black_winner) {
            this.persistent_board_state.winner = "black";
        }
    }

    end_turn () {
        if (this.is_local) {
            this.end_local_turn();
        }
        else {
            this.end_online_turn();
        }
    }

    end_local_turn () {
        turns.push(this.turn_manager.pending_turn);
        this.persistent_board_state.switch_current_move();
        this.ephemeral_board_state.clear();
        
        this.queen_promotion_check();
        this.victory_check();
    }

    end_online_turn () {
        this.ephemeral_board_state.clear();
        this.turn_manager.restore_state();
        this.socket_connector.send_turn(this.turn_manager.pending_turn);   
    }

    recieve_online_action () {
        this.queen_promotion_check();
        this.reload();
    }
}
