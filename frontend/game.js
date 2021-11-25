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
    /** @type {Object.<string, null} */ legal_moves;
    
    constructor () {
        this.selectable_pawns = {};
        this.selected_pawn = null;
        this.legal_moves = {};
    }

    clear () {
        this.selectable_pawns = {};
        this.selected_pawn = null;
        this.legal_moves = {};
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
    }

    render_selected () {
        let position = this.ephemeral_board_state.selected_pawn;
        if (position) {
            let targeted_field_dom = this.pawns[position];
            let target_color = this.persistent_board_state.fields[position].pawn.color;

            targeted_field_dom.setAttribute("class", "pawn-" + target_color + "-selected")            
        }
    }

    render_legal_moves () {
        for (let  [legal_move_position, _value] of Object.entries(this.ephemeral_board_state.legal_moves)) {
            let legal_move_indicator = document.createElement("button");
            legal_move_indicator.setAttribute("class", "possible-move");

            this.cells[legal_move_position].appendChild(legal_move_indicator);
        }
    }

    /**
     * Updating functions, these change things in an already rendered table
     */

    update_last_move () {

    }

    /**
     * Callback installation functions
     */

    install_select_callback(at_row, at_column, callback) {
        if (this.pawns[at_row + "_" + at_column]) {
            this.pawns[at_row + "_" + at_column].onclick = callback;
        } else {
            console.error("Tried installing callback on non-existent pawn!");
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
    }

    select_pawn(row_idx, column_idx) {
        let position = row_idx + "_" + column_idx;

        if (this.persistent_board_state.current_move != this.persistent_board_state.fields[position].pawn.color) {
            return;
        }

        if (this.ephemeral_board_state.selected_pawn == position) {
            this.ephemeral_board_state.selected_pawn = null;
            this.ephemeral_board_state.clear();
        }
        else {
            this.ephemeral_board_state.selected_pawn = position; 
            this.find_moves();
        }
    }

    is_field_empty_and_legal (row_idx, column_idx) {
        if (this.persistent_board_state.fields[row_idx + "_" + column_idx]) {
            if (this.persistent_board_state.fields[row_idx + "_" + column_idx].pawn)
                return false;
            else 
                return true;
        }
        else {
            return false;
        }
    }

    find_moves () {
        let [row_idx, column_idx] = this.ephemeral_board_state.selected_pawn.split("_", 2);
        row_idx = Number(row_idx);
        column_idx = Number(column_idx);
        
        this.find_simple_moves(row_idx, column_idx);
        this.find_queen_moves();
        this.find_kill_moves();
        this.find_queen_kill_moves();
    }

    check_and_set (row_idx, column_idx) {
        if (this.is_field_empty_and_legal(row_idx, column_idx)) {
            this.ephemeral_board_state.legal_moves[row_idx + "_" + column_idx] = true;
        }
    }

    find_simple_moves (row_idx, column_idx) {
        if (this.persistent_board_state.current_move == "white") {
            this.check_and_set(row_idx - 1, column_idx + 1)
            this.check_and_set(row_idx - 1, column_idx - 1)
        } else if (this.persistent_board_state.current_move == "black"){
            this.check_and_set(row_idx + 1, column_idx + 1)
            this.check_and_set(row_idx + 1, column_idx - 1)
        } else {
            console.error("Current move is not eithe white or black!")
        }
    }

    find_queen_moves () {
        
    }

    find_kill_moves() {

    }

    find_queen_kill_moves() {

    }
}