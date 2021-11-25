class BoardState {
    constructor() {

    }
}

get_board_state_field = function(i, j) {
    return board_state.fields[i + "_" +j];
}



let board_state = {
    configuration: {},
    fields: {},
    current_move: "white",
    dom_object: {}
};

initialize_board_state = function() {
    board_state.dom_object = document.getElementById("plansza");
    initialize_board_configuration(10, 4);
    initialize_board_fields();
    initialize_board_pawns();
}

initialize_board_configuration = function(size, starting_rows) {
    if (size <= 2 * starting_rows) {
        throw Error("Board size too small");
    }
    let board_configuration = {
        "size": size,
        "starting_rows": starting_rows
    };
    board_state.configuration = board_configuration;
}

initialize_board_fields = function() {
    let size = board_state.configuration.size;
    let fields = {};

    for (let i = 1; i <= size; i++) {
        for (let j = 1; j <=size; j++) {
            let color = (i+j)%2 == 1 ? "black" : "white";

            fields[i + "_" + j] = {
                "type": color,
                "pawn": null
                // TODO: add dom reference initializer
            }
        }
    }
    board_state.fields = fields;
}

initialize_board_pawns = function () {
    let size = board_state.configuration.size;
    let starting_rows = board_state.configuration.starting_rows;
    for (let row = 1; row <= starting_rows; row++) { 
        for (let column = 1; column <= size; column++) {
            let field = get_board_state_field(row, column);
            if (field.type == "black"){
                field.pawn = {
                    "type": "black",
                    "queen": false
                }
            }
        }

        for (let column = 1; column <= size; column++) {
            let field = get_board_state_field(row, column);
            if (field.type == "black"){
                field.pawn = {
                    "type": "white",
                    "queen": false
                }
            }
        }
    }
}