window.onload = function (){
    initialize_pawns();
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