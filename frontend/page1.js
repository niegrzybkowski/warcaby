let board_state = {};

window.onload = function (){
    initialize_pawns();
    color_board()
}

initialize_board_configuration = function(size, starting_rows) {
    if (size <= 2 * starting_rows) {
        throw Error("Board size too small");
    }
    let board_configuration = {
        "size": size,
        "starting_rows": starting_rows
    };
    board_state.board_configuration = board_configuration;
}

initialize_board_fields = function() {
    let size = board_state.board_configuration.size;
    let fields = {};

    for (let i = 1; i <= size; i++) {
        for (let j = 1; j <=size; j++) {
            let color = (i+j)%2 == 1 ? "black" : "white";

            fields[i + "_" + j] = {
                "type": color,
                "pawn": null
            }
        }
    }
    board_state.fields = fields;
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
        }

        
    }
    
}