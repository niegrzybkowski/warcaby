function test () {
    let bs = new PersistentBoardState(true);
    let es = new EphemeralBoardState();
    es.selected_pawn = "6_1";

    let br = new BoardRenderer(
        bs,
        es,
        document.getElementById("game_board_container")
    );
    let bc = new BoardController(
        bs,
        es,
        br
    );
    br.render();
    bc.install_all_select_callbacks();

    return [bs, es, br, bc];
}

function rowcol_to_position (row_idx, column_idx) {
    return row_idx + "_" + column_idx;
}

function split_posiiton (position) {
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
     
    /**
     * 
     * @param {number} size 
     * @param {number} starting_rows 
     * @param {string} starting_player 
     */
    constructor (size, starting_rows, starting_player) {
        this.size = size;
        this.starting_rows = starting_rows;
        this.starting_player = starting_player;
    }

    static default_config = new BoardConfiguration(8, 3, "white");
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

    /**
     * 
     * @param {boolean} default_init 
     */
    constructor(default_init) {
        if (default_init) {
            this.initialize_default()
        }
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

    switch_current_move () {
        if (this.current_move == "black") {
            this.current_move = "white";
        } else {
            this.current_move = "black";
        }
    }

    get_pawn_at (row_idx, column_idx) {
        if (this.fields[rowcol_to_position(row_idx, column_idx)]) {
            return this.fields[rowcol_to_position(row_idx, column_idx)].pawn
        }
    }

    set_pawn_at (row_idx, column_idx, new_pawn) {
        if (this.fields[rowcol_to_position(row_idx, column_idx)]) {
            this.fields[rowcol_to_position(row_idx, column_idx)].pawn = new_pawn;
        }
    }

    get_field_at (row_idx, column_idx) {
        return this.fields[rowcol_to_position(row_idx, column_idx)];
    }

    /**
     * Default initialization functions
     */

    initialize_default() {
        this.configuration = BoardConfiguration.default_config;
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
     * Not yet implemented
     */

    load_state(serialized_state) {
        let new_state = JSON.parse(serialized_state);
        this.configuration = new_state.configuration;
        this.fields = new_state.fields;
        this.current_move = new_state.current_move;
    }

    dump_state () {
        return JSON.stringify(this);
    }

    load_last_move () {

    }

    dump_last_move() {

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
}

class BoardRenderer {
    /**
     * Render state in DOM and control it
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
        this.render_current_move();
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
        this.persistent_board_state.for_each_field((row_idx, column_idx, field) => {
            if (field.pawn) {
                let pawn_button = document.createElement("button");
                
                if (field.pawn.color == "white") {
                    pawn_button.setAttribute("class", "pawn-white");
                }
                else {
                    pawn_button.setAttribute("class", "pawn-black");
                }

                this.cells[row_idx + "_" + column_idx].appendChild(pawn_button);
                this.pawns[row_idx + "_" + column_idx] = pawn_button;
            }
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
     * Updating functions, these change things in an already rendered table
     */

    update_last_move () {

    }

    /**
     * Callback installation functions
     */

    install_select_callback(row_idx, column_idx, callback) {
        if (this.pawns[rowcol_to_position(row_idx, column_idx)]) {
            this.pawns[rowcol_to_position(row_idx, column_idx)].onclick = callback;
        } else {
            console.error("Tried installing callback on non-existent pawn!");
        }
    }

    install_legal_move_callback(row_idx, column_idx, callback) {
        if (this.legal_move_indicators[rowcol_to_position(row_idx, column_idx)]) {
            this.legal_move_indicators[rowcol_to_position(row_idx, column_idx)].onclick = callback;
        } else {
            console.error("Tried installing callback on non-existent legal move indicator!");
        }
    }
}

class BoardController {
    /**
     * Game logic
     */

    /** @type {PersistentBoardState} */ persistent_board_state;
    /** @type {EphemeralBoardState} */ ephemeral_board_state;
    /** @type {BoardRenderer} */ board_renderer;

    constructor (persistent_board_state, ephemeral_board_state, board_renderer) {
        this.persistent_board_state = persistent_board_state;
        this.ephemeral_board_state = ephemeral_board_state;
        this.board_renderer = board_renderer;
    }

    install_all_select_callbacks() {
        let controller = this;

        this.persistent_board_state.for_each_field((row_idx, column_idx, field) => {
            if (field.pawn) {
                this.board_renderer.install_select_callback(row_idx, column_idx, () => {
                    controller.select_pawn(row_idx, column_idx);
                    controller.board_renderer.render();
                    controller.install_all_select_callbacks();
                });
            }
        });

        for (let [position, _value] of Object.entries(this.ephemeral_board_state.legal_moves)) {
            let [row_idx, column_idx] = split_posiiton(position);
            this.board_renderer.install_legal_move_callback(row_idx, column_idx, () => {
                controller.move_pawn_to(row_idx, column_idx);
                controller.board_renderer.render();
                controller.install_all_select_callbacks();
            });
        }
    }

    select_pawn(row_idx, column_idx) {
        let position = rowcol_to_position(row_idx, column_idx);

        if (this.persistent_board_state.current_move != this.persistent_board_state.fields[position].pawn.color) {
            return;
        }

        if (this.ephemeral_board_state.selected_pawn == position) {
            this.ephemeral_board_state.clear();
        }
        else {
            this.ephemeral_board_state.clear();
            this.ephemeral_board_state.selected_pawn = position;
            this.find_moves();
        }
    }

    move_pawn_to (move_row_idx, move_column_idx) {
        let [selected_row_idx, selected_column_idx] = split_posiiton(this.ephemeral_board_state.selected_pawn);
        let selected_pawn = this.persistent_board_state.get_pawn_at(selected_row_idx, selected_column_idx);
        
        this.persistent_board_state.set_pawn_at(move_row_idx, move_column_idx, selected_pawn);
        this.persistent_board_state.set_pawn_at(selected_row_idx, selected_column_idx, null)
        this.persistent_board_state.switch_current_move();

        this.ephemeral_board_state.clear();
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

    find_moves () {
        let [row_idx, column_idx] = split_posiiton(this.ephemeral_board_state.selected_pawn);
        
        this.find_simple_moves(row_idx, column_idx);
        this.find_queen_moves();
        this.find_kill_moves(row_idx, column_idx);
        this.find_queen_kill_moves();
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

    find_queen_moves () {
        
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
                rowcol_to_position(landing_row_idx, landing_column_idx)
            ] = rowcol_to_position(enemy_row_idx, enemy_column_idx);
        }
    }

    find_kill_moves(row_idx, column_idx) {
        this.kill_check_and_set(row_idx + 1, column_idx + 1, row_idx + 2, column_idx + 2);
        this.kill_check_and_set(row_idx - 1, column_idx + 1, row_idx - 2, column_idx + 2);
        this.kill_check_and_set(row_idx + 1, column_idx - 1, row_idx + 2, column_idx - 2);
        this.kill_check_and_set(row_idx - 1, column_idx - 1, row_idx - 2, column_idx - 2);
    }

    find_queen_kill_moves() {

    }
}