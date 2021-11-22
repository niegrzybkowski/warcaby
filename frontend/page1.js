let positions = new Array(100);
let chosen = false;
let chosen_id = new Number;
let last_move = "b";

let board_state = {
    configuration: {},
    fields: {},
    dom_object: {}
};

get_board_state_field = function(i, j) {
    return board_state.fields[i + "_" +j];
}

window.onload = function (){
    initialize_pawns();
    color_board();
    make_buttons_clicable();
}

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

color_board = function(){
    for(let i = 0; i < 100; i ++){
        let j;
        if(i<10){
            j = '0' + i + 'td';
        }
        else{
            j = i + 'td';
        }
        let firstchar = Number(j.charAt(0));
        let secondchar = Number(j.charAt(1));
        let field = document.getElementById(j);
        if((firstchar+secondchar)%2==1){
            field.style.backgroundColor = "brown";
        }
        else{
            field.style.backgroundColor = "#f5b342";
        }
        

    }
}

initialize_pawns = function(){
    for(let i = 1; i < 40; i = i + 1){
        let j;

        if(i<10){
            j = '0' + i;
        }
        else{
            j = i.toString();
        }
        let firstchar = Number(j.charAt(0));
        let secondchar = Number(j.charAt(1));
        let pawn = document.getElementById(j);
        if((firstchar+secondchar)%2==1){
            pawn.style.backgroundColor = "black";
            positions[i] = "b";
        }

    }
    for(let i = 99; i >= 60; i = i - 1){
        let j;
        j = i.toString();
        let firstchar = Number(j.charAt(0));
        let secondchar = Number(j.charAt(1));
        let pawn = document.getElementById(j);
        if((firstchar+secondchar)%2==1){
            pawn.style.backgroundColor = "yellow";
            positions[i] = "w";
        }

        
    }
    
}

make_buttons_clicable = function(){
    for(let i = 0; i < 100; i = i + 1){
        let j;
        if(i<10){
            j = '0' + i;
        }
        else{
            j = i.toString();
        }
        let pawn = document.getElementById(j);
        pawn.onclick = button_clicked;
    }
}

button_clicked = function(){
    if(chosen==false){
        if(positions[this.id] == "w" || positions[this.id] == "b"){
            chosen=true;
            chosen_id=this.id;
        }
    }
    else{
        if(positions[this.id] == "w" || positions[this.id] == "b"){
            chosen=true;
            chosen_id=this.id;
        }
        else{
            let second_id = this.id;
            var moved = make_move(chosen_id, second_id);
            if(moved==false){
                beat(chosen_id, second_id);
            }
            chosen=false;
        } 
    }
}

make_move = function(first_id, second_id){
    let color;
    color = positions[first_id];
    if(color == 'w'){
        if(second_id == +first_id-10-1 || second_id == +first_id-10+1){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "yellow";
            positions[first_id] = null;
            positions[second_id] = "w";
            return true;
        }
    }
    if(color == 'b'){
        if(second_id == +first_id +10-1 || second_id == +first_id+10+1){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "black";
            positions[first_id] = null;
            positions[second_id] = "b";
            return true;
        }

    }
    return false;

}

beat = function(first_id, second_id){
    let color;
    color = positions[first_id];
    if(color == 'w'){
        if(second_id == +first_id-20-2 && positions[+first_id-10-1]=="b"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id-10-1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "yellow";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "w";
            positions[+first_id-10-1] = null;
            
        }
        if(second_id == +first_id-20+2 && positions[+first_id-10+1]=="b"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id-10+1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "yellow";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "w";
            positions[+first_id-10+1] = null;
        }
        if(second_id == +first_id+20-2 && positions[+first_id+10-1]=="b"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id+10-1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "yellow";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "w";
            positions[+first_id+10-1] = null;
        }
        if(second_id == +first_id+20+2&& positions[+first_id+10+1]=="b"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id+10+1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "yellow";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "w";
            positions[+first_id+10+1] = null;
        }
    }
    if(color == 'b'){
        if(second_id == +first_id-20-2 && positions[+first_id-10-1]=="w"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id-10-1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "black";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "b";
            positions[+first_id-10-1] = null;
            
        }
        if(second_id == +first_id-20+2 && positions[+first_id-10+1]=="w"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id-10+1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "black";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "b";
            positions[+first_id-10+1] = null;
        }
        if(second_id == +first_id+20-2 && positions[+first_id+10-1]=="w"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id+10-1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "black";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "b";
            positions[+first_id+10-1] = null;
        }
        if(second_id == +first_id+20+2&& positions[+first_id+10+1]=="w"){
            let pawn1 = document.getElementById(first_id);
            let pawn2 = document.getElementById(second_id);
            let pawn_beated = document.getElementById(+first_id+10+1);
            pawn1.style.backgroundColor = "transparent";
            pawn2.style.backgroundColor = "black";
            pawn_beated.style.backgroundColor = "transparent";
            positions[first_id] = null;
            positions[second_id] = "b";
            positions[+first_id+10+1] = null;
        }
    }
}