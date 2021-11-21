window.onload = function (){
    initialize_pawns();
    color_board()
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
        console.log(firstchar+secondchar);
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
    for(let i = 1; i < 40; i = i + 2){
        let j;
        if(i<10){
            j = '0' + i;
        }
        if(i>=10){
            if(i==11 || i==31){
                i--;
            }
            j = i.toString();
        }
        let pawn = document.getElementById(j);
        pawn.style.backgroundColor = "black";
        if(i==18){
            i++;
        }
    }
    for(let i = 98; i >= 60; i = i - 2){
        let j;
        if(i==88 || i==68){
            i++;
        }
        if(i==79){
            i--;
        }
        j = i.toString();
        let pawn = document.getElementById(j);
        pawn.style.backgroundColor = "yellow";
        
    }
    
}