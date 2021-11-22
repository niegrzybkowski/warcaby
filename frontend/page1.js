let positions = new Array(100);

window.onload = function (){
    initialize_pawns();
    color_board();
    make_buttons_clicable();
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
    let id = this.id;
    console.log(id)
}