// Global variable definition
var d = 4; // d je dolzina med lokacijo koordinatnega sistema pogleda in projecirno ravnino
var cameraLocation = [0.0, 0.0, -8.0];

// Buffers
var vertices = [];
var edges = [];
var normals = [];
var verticesColors = [];

var Ka_rgb = vec3.create();
var Kd_rgb = vec3.create();
var Ks_rgb = vec3.create();
var Ns;

var lights = [];

var shine_constant = 0.70;


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
	
	//debugPrintMat(vex);
	return vex;
}

//https://en.wikipedia.org/wiki/Phong_reflection_model
function refreshColors(){
	v_cnt = 0;
	for(var i = 0; i < vertices.length; ++i){
		var vex = vec3.fromValues(vertices[i][0], vertices[i][1], vertices[i][2]);

		var color = vec3.create();
		for(var li = 0; l < lights.length; ++l){
			var Lm_n = vec3.create();
			var light_pos = vec3.fromValues(lights[li][0][0], lights[li][0][1], lights[li][0][2]);
			var normal_vec = vec3.fromValues(normals[i][0], normals[i][1], normals[i, 2]);

			//Kd * (Li * n) = first_part
			var light_vec = vec3.create();
			vec3.subtract(light_vec, vex, lights_pos);
			vec3.multiply(Lm_n, light_vec, normal_vec);
			vec3.multiply(Lm_n, Lm_n, Kd_rgb);

			// RM = 2 * (Lm * N) * N - Lm
			var Rm_V = vec3.create();
			vec3.multiply(Rm_V, light_vec, normal_vec);
			vec3.multiply(Rm_V, Rm_V, normal_vec);
			var two = vec3.fromValues(2, 2, 2);
			vec3.multiply(Rm_V. Rm_V, two);
			vec3.subtract(Rm_V, Rm_V, light_vec);
	
			// Rm * V
			var cam_vec = vec3.create();
			var cam_pos = vec3.fromValues(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
			vec3.subtract(cam_vec, vex, cam_pos);
			vec3.multiply(Rm_V, Rm_V, cam_vec);

			// (Rm * V) ^ alpha = second_part
			Rm_V = vec3.fromValues(Math.pow(Rm_V[0], shine_constant), Math.pow(Rm_V[1], shine_constant), Math.pow(Rm_V[2], shine_constant));

			// second_part = second_part * Ks
			vec3.multiply(Rm_V, Rm_V, Ks_rgb);			

			// first_part + second_part = sum
			var eq = create.vec3();
			vec3.add(eq, Lm_n, h)

			// Ci * sum
			var light_col =  vec3.fromValues(lights[li][1][0], lights[li][1][1], lights[li][1][2])
			vec3.multiply(eq, light_col, eq);

			//r = lights[li][1][0]*(Kd_rgb[0]*(rLm*n[i][0])+Ks_rgb[0]*Math.pow((), shine_constant));
			vec3.add(color, color, eq);
		}

		verticesColors[v_cnt] = color;
		v_cnt++;
		
	}
}

function debugPrintArr(name, arr){
	console.log(name+":");
	for(i = 0; i < arr.length; ++i){
		var str = "[ ";
		for(j = 0; j < arr[i].length; ++j){
			str += arr[i][j] + " ";
		}
		str += "]";
		console.log(str);
	}
	console.log("\n");
}

function debugPrintMat(name, mat){
	console.log(name+":");
	var str = "[ ";
	for(i = 0; i < mat.length; ++i){
		str += mat[i] + " ";
		if((i+1) % 4 === 0){
			str += "]";
			console.log(str);
			var str = "[ ";
		}
	}	
	console.log("\n");
}

// ctx - context
function draw(ctx, vertices, edges){
	 
	// set context
	ctx.beginPath();
	ctx.lineWidth = "1";
	ctx.tr;
	ctx.strokeStyle = "black";

	refreshColors();

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
	};
	fileReader.readAsText(file, "UTF-8");
}

function parseInput(input){
    var lines = input.split("\n");
	
	var vex_cnt_i = 0;
	var vex_cnt_j = -1;
	var nor_cnt = 0;

	var edg_cnt = -1;
	var li_cnt = 0;
    for(var i = 0; i < lines.length; ++i){
		
		//console.log(lines[i]);
        
		if(lines[i].charAt(0) == "v"){
           
            var vexes = lines[i].split(" ");
			
			//console.log(vexes);
           	
           	var vex_cnt_j = -1;
           	vertices.push([]);

			// parse vertices
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[1]);
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[2]);
			vertices[vex_cnt_i][++vex_cnt_j] = parseFloat(vexes[3]);
			vertices[vex_cnt_i][++vex_cnt_j] = 1.0; //add 1.0 because it's a homogene matrix
			
			var nor_cnt_j = -1; 
			normals.push([]);

			normals[vex_cnt_i][++nor_cnt_j] = parseFloat(vexes[4]);
			normals[vex_cnt_i][++nor_cnt_j] = parseFloat(vexes[5]);
			normals[vex_cnt_i][++nor_cnt_j] = parseFloat(vexes[6]);

			vex_cnt_i++;
        }
		else if(lines[i].charAt(0) == "f"){
			var edg = lines[i].split(" ");

			edges[++edg_cnt] = parseFloat(edg[1]);
			edges[++edg_cnt] = parseFloat(edg[2]);
            edges[++edg_cnt] = parseFloat(edg[3]);
        }
        else if(lines[i].charAt(0) == "m"){
        	var material = lines[i].split(" ");

        	Ka_rgb = vec3.fromValues(parseFloat(material[1]), parseFloat(material[2]), parseFloat(material[3]));
        	Kd_rgb = vec3.fromValues(parseFloat(material[4]), parseFloat(material[5]), parseFloat(material[6]));
        	Ks_rgb = vec3.fromValues(parseFloat(material[7]), parseFloat(material[8]), parseFloat(material[9]));

        	Ns = parseFloat(material[10]);
        }
        else if(lines[i].charAt(0) == "l"){
        	var li = lines[i].split(" ");

        	lights.push([]);
        	var L_xyz = [];
			var L_rgb = [];

        	L_xyz[0] = parseFloat(li[1]);
        	L_xyz[1] = parseFloat(li[2]);
        	L_xyz[2] = parseFloat(li[3]);

        	L_rgb[0] = parseFloat(li[4]);
        	L_rgb[1] = parseFloat(li[5]);
        	L_rgb[2] = parseFloat(li[6]); 

        	lights[li_cnt].push(L_xyz);
			lights[li_cnt].push(L_rgb);

			++li_cnt;
        }
		// other chars
		else{
			//alert("Nepoznan zacetni znak: " + lines[i].charAt(0));
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
	
	/*console.log("\n\n");
	console.log("\nKa_rgb: "+Ka_rgb);
	console.log("\nKa_rgb: "+Kd_rgb);
	console.log("\nKa_rgb: "+Ks_rgb);
	console.log("\nNs: "+Ns);

	debugPrintArr("vertices", vertices);
	debugPrintMat("edges", edges);
	debugPrintArr("normals", normals);
	*/
	console.log("\nlight 1: "+lights[0][0]+" | "+lights[0][1]);
	console.log("\nlight 2: "+lights[1][0]+" | "+lights[1][1]);
		

	var canvas = document.getElementById("mycanvas");
	canvas_w = canvas.width;
	canvas_h = canvas.height;
	
    var ctx = canvas.getContext("2d");
	
	ctx.translate(640,360);
	ctx.scale(1, -1); // change y direction to up

	//transformModel();
	setView();

	draw(ctx, vertices, edges);

	/*
	//var a = vec3.create();
	//var b = vec3.create();

	// Vector operations example:
	var a = vec3.fromValues(1, 2, 3);
	var b = vec3.fromValues(0, 1, 0);

	var c = vec3.create();
	vec3.subtract(c, a, b);
	console.log(a+" - "+b+" = "+c);*/
}