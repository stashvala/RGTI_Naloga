// Global variable definition
var d = 4; // d je dolzina med lokacijo koordinatnega sistema pogleda in projecirno ravnino
var cameraLocation = [0.0, 0.0, -8.0];

// Buffers
var pyramidVertexPositionBuffer;

// Model, view, projection and transformation matrices
var mMatrix = mat4.create();
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var tMatrix = mat4.create();

// Canvas
var canvas_w;
var canvas_h;

// Drawing
var extend = 100;

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
	
	debugPrintArr(newVex);
	return newVex;
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
	//console.log(str);
}

// ctx - context
function draw(ctx, vertices, edges){
	 
	 // set context
	 ctx.beginPath();
	 ctx.lineWidth = "1";
	 ctx.strokeStyle = "black";
	 ctx.clearRect(640, -360, -canvas_w, canvas_h);
	 
	 // prepare vertices
	 vertices = prepareVertices(vertices);
	 for(i = 0; i < edges.length -1; i += 2){ //:TODO: check if i += 2 is ok
		var v = edges[i] - 1;
		//console.log("*v="+v+"*");
		//console.log("from ("+vertices[v][0]+", "+vertices[v][1]+")");
		ctx.moveTo(vertices[v][0] * extend, vertices[v][1] * extend);
		v = edges[i+1] - 1;
		//console.log("*v="+v+"*");
		//console.log("to ("+vertices[v][0]+", "+vertices[v][1]+")");
		ctx.lineTo(vertices[v][0] * extend, vertices[v][1] * extend);
	 }
	 
	 ctx.stroke();
}


function start(){
	
	//:TODO: read from file
	// we add 1.0 to each line because
	var vertices = [[0.0, 0.0, 0.0, 1.0], 
				    [1.0, 0.0, 0.0, 1.0],
				    [0.0, 1.0, 0.0, 1.0],
				    [0.0, 0.0, 1.0, 1.0]];
	var edges = [1, 3, 2, 
				 1, 2, 4,
				 1, 4, 3,
				 1, 4, 3,
				 2, 3, 4];
	
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