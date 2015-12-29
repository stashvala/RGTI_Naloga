// Global variable definition
var d = 4; // d je dolzina med lokacijo koordinatnega sistema pogleda in projecirno ravnino
var cameraLocation = [0.0, 0.0, -8.0];

// Buffers
var vertices = [];
var edges = [];
var normals = [];
var verticesColors = [];
var lights = [];

var Ka_rgb = vec3.create();
var Kd_rgb = vec3.create();
var Ks_rgb = vec3.create();

var shine_constant;

// Model, view, projection and transformation matrices
var mMatrix = mat4.create();
var vMatrix = mat4.create();
var pMatrix = mat4.create();
var tMatrix = mat4.create();

// User movement
var mouseX;
var mouseY;
var mousePressed = false;
var rotX = 0;
var rotY = 0;
var rotZ = 0;

// Canvas
var canvas_w;
var canvas_h;
var ctx;

// Drawing
var extend = 200;

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
		for(j = 0; j < v[i].length; ++j){
			newVex[i][j] = 0;
			for(k = 0; k < v[i].length; ++k){
				newVex[i][j] +=  v[i][k] * tMatrix[cnt];
				cnt++;
			}
		}
		// console.log("vex "+i+": "+ newVex[i]);
	}

	refreshColors(newVex);
	
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
	
	// convert to 1d arr for easier drawing
	vex = [];
	cnt = 0;
	for(i = 0; i < newVex.length; ++i){
		for(j = 0; j < newVex[i].length; ++j){
			vex[cnt] =  newVex[i][j];
			++cnt;
		}
	}
	
	return vex;
}


//https://en.wikipedia.org/wiki/Phong_reflection_model
function refreshColors(vex){
	v_cnt = 0;
	for(var i = 0; i < vertices.length; ++i){
		//var vex_pos = vec3.fromValues(vertices[i][0], vertices[i][1], vertices[i][2]);
		var vex_pos = vec3.fromValues(vex[i][0], vex[i][1], vex[i][2]);

		var color = vec3.create();
		for(var li = 0; li < lights.length; ++li){
			
			var normal_vec = vec3.fromValues(normals[i][0], normals[i][1], normals[i][2]);
			
			var light_pos = vec3.fromValues(lights[li][0][0], lights[li][0][1], lights[li][0][2]);
			var light_vec = vec3.create();
			vec3.subtract(light_vec, light_pos, vex_pos);
			
			vec3.normalize(light_vec, light_vec); // normalize
			vec3.normalize(normal_vec, normal_vec); // normalize
			
			// (Lm dot N) * Kd_rgb = first_part
			var Lm_N = vec3.dot(light_vec, normal_vec);
			var Lm_N_Kd = vec3.create();
			vec3.scale(Lm_N_Kd, Kd_rgb, Lm_N);

			// Rm = 2 * (Lm dot N) * N - Lm
			var Rm = vec3.create();
			vec3.scale(Rm, normal_vec, (2 * Lm_N));
			vec3.subtract(Rm, Rm, light_vec);
			vec3.normalize(Rm, Rm); // normalize
	
			// V
			var cam_vec = vec3.create();
			var cam_pos = vec3.fromValues(cameraLocation[0], cameraLocation[1], cameraLocation[2]);
			vec3.subtract(cam_vec, cam_pos, vex_pos);
			vec3.normalize(cam_vec, cam_vec); // normalize
			
			// (Rm dot V) ^ alpha * Ks = second_part
			var Rm_V = vec3.dot(Rm, cam_vec);
			Rm_V = Math.pow(Rm_V, shine_constant);
			var Rm_V_Ks = vec3.create();
			vec3.scale(Rm_V_Ks, Ks_rgb, Rm_V);			

			// first_part + second_part = sum
			var equation = vec3.create();
			vec3.add(equation, Lm_N_Kd, Rm_V_Ks);

			// Ci * sum
			var light_col = vec3.fromValues(lights[li][1][0], lights[li][1][1], lights[li][1][2]);
			vec3.multiply(equation, light_col, equation);

			// sum all lights to get vertex color
			vec3.add(color, color, equation);
		}

		// append color to vertex
		verticesColors[v_cnt] = color;
		v_cnt++;
		
	}
}

function rgb (r, g, b) {
	r = Math.floor(r);
	g = Math.floor(g);
	b = Math.floor(b);

	return ["rgb(", r, ",", g, ",", b, ")"].join("");
}

// ctx - context
function draw(){
	 
	// set context
	ctx.beginPath();
	ctx.lineWidth = 5;
	ctx.clearRect(640, -360, -canvas_w, canvas_h);
	//ctx.fillStyle = "black";

	v = prepareVertices(vertices);

	//refreshColors(v);
	
	//console.log("vector: "+v.length+" "+edges.length);

	for (i = 0; i < edges.length; i = i+2){
		var vertex1 = (edges[i]-1)*4;
		var vertex2 = (edges[i+1]-1)*4;

		var x1 = v[vertex1] * extend;
		var y1 = v[vertex1+1] * extend;

		var x2 = v[vertex2] * extend;
		var y2 = v[vertex2+1] * extend;

		// console.log(i+": x = "+x1+", y = "+y1);
  		// console.log(i+1+": x = "+x2+", y = "+y2);

		var grad = ctx.createLinearGradient(x1, y1, x2, y2);

		var color1 = vec3.create();
		color1 = verticesColors[edges[i]-1];
		var color2 = vec3.create();
		color2 = verticesColors[edges[i+1]-1];

		console.log(i+": color1 = "+color1);
		console.log(i+1+": color2 = "+color2+"\n");

		grad.addColorStop(0, rgb(color1[0]*255, color1[1]*255, color1[2]*255));
		grad.addColorStop(1, rgb(color2[0]*255, color2[1]*255, color2[2]*255));

		ctx.strokeStyle = grad;

		ctx.moveTo(x1, y1);
		ctx.lineTo(x2, y2);
		
		//ctx.stroke();
		
	}

	ctx.stroke();
}

function onMouseClickEvent(event){
	if(event.which == 1 || event.which == 2 || event.which == 3){
		mousePressed = true;
		mouseX = event.pageX;
		mouseY = event.pageY;
	}
	else{
		alert("Fancy mouse you got there, mate!");
	}
}

function onMouseRelease(){
	mousePressed = false;

	mat4.multiply(mMatrix, mMatrix, rotateX(rotX));
	mat4.multiply(mMatrix, mMatrix, rotateY(rotY));

	draw();

	rotX = 0;
	rotY = 0;
}

function onMouseMove(event){
	if(mousePressed == true){
		rotX = rotX + -(mouseY-event.pageY)/300;
        rotY = rotY + -(mouseX-event.pageX)/300;
        
        mat4.multiply(mMatrix, mMatrix, rotateX(rotX));
        mat4.multiply(mMatrix, mMatrix,rotateY(rotY));
        
        draw();
        
        mat4.multiply(mMatrix, mMatrix, rotateY(-rotY));
        mat4.multiply(mMatrix, mMatrix, rotateX(-rotX));
       
        mouseX = event.pageX;
        mouseY = event.pageY;
	}
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

			//console.log("normal " + vex_cnt_i +": "+normals[vex_cnt_i]);

			vex_cnt_i++;
        }
		else if(lines[i].charAt(0) == "f"){
			var edg = lines[i].split(" ");

			edges[++edg_cnt] = parseFloat(edg[1]);
			edges[++edg_cnt] = parseFloat(edg[2]);

			edges[++edg_cnt] = parseFloat(edg[1]);
            edges[++edg_cnt] = parseFloat(edg[3]);

            edges[++edg_cnt] = parseFloat(edg[2]);
            edges[++edg_cnt] = parseFloat(edg[3]);
        }
        else if(lines[i].charAt(0) == "m"){
        	var material = lines[i].split(" ");

        	Ka_rgb = vec3.fromValues(parseFloat(material[1]), parseFloat(material[2]), parseFloat(material[3]));
        	Kd_rgb = vec3.fromValues(parseFloat(material[4]), parseFloat(material[5]), parseFloat(material[6]));
        	Ks_rgb = vec3.fromValues(parseFloat(material[7]), parseFloat(material[8]), parseFloat(material[9]));

        	//Ns
        	shine_constant = parseFloat(material[10]);
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
	
	console.log("\nlight 1: "+lights[0][0]+" | "+lights[0][1]);
	console.log("\nlight 2: "+lights[1][0]+" | "+lights[1][1]);
	*/

	var canvas = document.getElementById("mycanvas");
	canvas_w = canvas.width;
	canvas_h = canvas.height;
	
    ctx = canvas.getContext("2d");
	
	ctx.translate(640,360);
	ctx.scale(1, -1); // change y direction to up

	//transformModel();
	setView();

	draw();

	// http://www.w3schools.com/jsref/dom_obj_event.asp
	// http://www.w3.org/TR/DOM-Level-3-Events/
	canvas.addEventListener('mousedown', onMouseClickEvent, false);
    document.addEventListener('mousemove', onMouseMove, false);
    document.addEventListener('mouseup', onMouseRelease, false);


}