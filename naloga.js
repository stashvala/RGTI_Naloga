// Global variable definition
var d = 4; // d je dolzina med lokacijo koordinatnega sistema pogleda in projecirno ravnino
var cameraLocation = [0.0, 0.0, -8.0];

// Buffers
var vertices = [];
var edges = [];

// Model, view, projection and transformation matrices
var mMatrix = mat4.create();
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var tMatrix = mat4.create();

// Canvas
var canvas_w;
var canvas_h;

// Drawing
var extend = 50;

// https://en.wikipedia.org/wiki/Rotation_matrix

function rotateX(alpha){
	var matX = mat4.create();
	
	matX[5] = Math.cos(alpha);
	matX[6] = -1 * Math.sin(alpha);
	matX[9] = Math.sin(alpha);
	matX[10] = Math.cos(alpha);
	
	return matX;
}
function rotateY(alpha){
	var matY = mat4.create();
	
	matY[0] = Math.cos(alpha);
	matY[2] = Math.sin(alpha);
	matY[8] = -1 * Math.sin(alpha);
	matY[10] = Math.cos(alpha);
	
	return matY;
}
function rotateZ(alpha){
	var matZ = mat4.create();
	
	matZ[0] = Math.cos(alpha);
	matZ[1] = -1 * Math.sin(alpha);
	matZ[4] = Math.sin(alpha);
	matZ[5] = Math.cos(alpha);
	
	return matZ;
}

// https://en.wikipedia.org/wiki/Translation_(geometry)
function translate(dx, dy, dz){
	mat = mat4.create();
	
	mat[3] = dx;
	mat[7] = dy;
	mat[11] = dz;
	
	return mat;
}

// https://en.wikipedia.org/wiki/Scaling_(geometry)
function scale(sx, sy, sz){
	mat = mat4.create();
	
	mat[0] = sx;
	mat[5] = sy;
	mat[10] = sz;
	
	return mat;
}

function perspective(d){ // primerna vrednost je d=4
	var mat = mat4.create();
	
	mat[14] = 1/d;
	mat[15] = 0;
	
	return mat;
}

// needed for later use of event listeners
function transformModel(){

}

function setView(){
	vMatrix = translate(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
	pMatrix = perspective(d);
	mat4.multiply(vMatrix, vMatrix, pMatrix );
}

function updateTransformMatrix(){
	mat4.multiply(tMatrix, mMatrix, vMatrix);
}

function prepareVertices(v){
	
	//update tMatrix
	updateTransformMatrix();
	
	//debugPrintMat(tMatrix);
	
	// multiply vertices with tMatrix
	var newVex = [];
	for(i = 0; i < v.length; ++i){
		newVex[i] = [];
		var cnt = 0;
		//console.log("******i = "+i+"******");
		for(j = 0; j < v[i].length; ++j){
			//console.log("--j = "+j+"--");
			newVex[i][j] = 0;
			for(k = 0; k < v[i].length; ++k){
				//newVex[i][j] +=  v[i][k] * tMatrix[j][k];
				//console.log("newVex["+i+"]["+j+"] += v["+i+"]["+k+"] * tMatrix["+cnt+"]");
				//console.log("v = "+v[i][k]+", tMat[cnt] = "+tMatrix[cnt]); 
				newVex[i][j] +=  v[i][k] * tMatrix[cnt];
				cnt++;
			}
		}
	}
	
	//debugPrintArr(newVex);
	
	// normalize with 'w'
	for(i = 0; i < newVex.length; ++i){
		var x = newVex[i][3];
		if(x !== 0 || x !== 1){
			newVex[i][0] /= x;
			newVex[i][1] /= x;
			newVex[i][2] /= x;
		}
		newVex[i][3] = 1;
	}
	
	//debugPrintArr(newVex);
	
	// convert to 1d arr for easier drawing
	vex = [];
	cnt = 0;
	for(i = 0; i < newVex.length; ++i){
		for(j = 0; j < newVex[i].length; ++j){
			vex[cnt] =  newVex[i][j];
			++cnt;
		}
	}
	
	debugPrintMat(vex);
	return vex;
}

function debugPrintArr(arr){
	for(i = 0; i < arr.length; ++i){
		var str = "[ ";
		for(j = 0; j < arr[i].length; ++j){
			str += arr[i][j] + " ";
		}
		str += "]";
		console.log(str);
	}
}

function debugPrintMat(mat){
	var str = "[ ";
	for(i = 0; i < 16; ++i){
		str += mat[i] + " ";
		if((i+1) % 4 === 0){
			str += "]";
			console.log(str);
			var str = "[ ";
		}
	}		
}

// ctx - context
function draw(ctx, vertices, edges){
	 
	// set context
	ctx.beginPath();
	ctx.lineWidth = "1";
	ctx.tr;
	ctx.strokeStyle = "black";

	// prepare vertices
	v = prepareVertices(vertices);
	for (i =0; i < edges.length; i = i+2){       
		ctx.moveTo(v[(edges[i]-1)*3] * extend, v[((edges[i]-1)*3)+1] * extend);
		ctx.lineTo(v[(edges[i+1]-1)*3] * extend, v[((edges[i+1]-1)*3)+1] * extend)
	}

	ctx.stroke();
}

function readFile(){
	var file = document.getElementById("fileInput").files[0];

	var fileReader = new FileReader();
	fileReader.onload = function(fileLoadedEvent){
		var text = fileLoadedEvent.target.result;

		parseInput(text);
		start();
	}
}

function parseInput(input){
    var lines = input.split("\n");
	
	var vex_cnt_i = 0;
	var vex_cnt_j = -1;
	var edg_cnt = -1;
    for(i = 0; i < lines.length; ++i){
		
		console.log(lines[i]);
        
		if(lines[i].charAt(0) == "v"){
           
            var vexes = lines[i].split(" ");
			
			//console.log(vexes);
            			
			// parse vertices
			vertices[vex_cnt_i] = [];
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[1]);
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[2]);
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[3]);
			vertices[vex_cnt_i][++vex_cnt_j] = 1.0; //add 1.0 because it's a homogene matrix
			vex_cnt_i++;
        }
		else if(lines[i].charAt(0) == "f"){
           
			var edg = lines[i].split(" ");
            

        }
		else if(lines[i].charAt(0) === " " ||
				lines[i].charAt(0) === "\n") { ; }
		else{
			alert("Nepoznan zacetni znak: " + lines[i].charAt(0));
		}
    }
}

function start(){
	
	//:TODO: read from file
	// we add 1.0 to each line because it' a homogene matrix
	/*  vertices = [[0.0, 0.0, 0.0, 1.0], 
					[1.0, 0.0, 0.0, 1.0],
				    [0.0, 1.0, 0.0, 1.0],
				    [0.0, 0.0, 1.0, 1.0]];
	    edges = [1, 3, 2, 
				 1, 2, 4,
				 1, 4, 3,
				 2, 3, 4];
	*/
	
	debugPrintArr(vertices);
	debugPrintMat(edges);
	
	var canvas = document.getElementById("mycanvas");
	canvas_w = canvas.width;
	canvas_h = canvas.height;
	
    var ctx = canvas.getContext("2d");
	
	ctx.translate(640,360);
	ctx.scale(1, -1); // change y direction to up

	//transformModel();
	setView();
	
	draw(ctx, vertices, edges);
	
}