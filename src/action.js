/* async system call */
const spawnSync = require('child_process').spawnSync;

var SerialPort = require('serialport');
var ser_port;
var read_ine;
var serial_parser;
var debug = true;
var port_list = [];
var IN_PROGRESS = 1;
var CONNECTED = 2;
var DISCONNECTED = 3;
var serial_status = DISCONNECTED;

var cam_colors = ["#480F",
"#400F","#400F","#400F","#4010","#3810","#3810","#3810","#3810","#3010","#3010",
"#3010","#2810","#2810","#2810","#2810","#2010","#2010","#2010","#1810","#1810",
"#1811","#1811","#1011","#1011","#1011","#0811","#0811","#0811","#0011","#0011",
"#0011","#0011","#0011","#0031","#0031","#0051","#0072","#0072","#0092","#00B2",
"#00B2","#00D2","#00F2","#00F2","#0112","#0132","#0152","#0152","#0172","#0192",
"#0192","#01B2","#01D2","#01F3","#01F3","#0213","#0233","#0253","#0253","#0273",
"#0293","#02B3","#02D3","#02D3","#02F3","#0313","#0333","#0333","#0353","#0373",
"#0394","#03B4","#03D4","#03D4","#03F4","#0414","#0434","#0454","#0474","#0474",
"#0494","#04B4","#04D4","#04F4","#0514","#0534","#0534","#0554","#0554","#0574",
"#0574","#0573","#0573","#0573","#0572","#0572","#0572","#0571","#0591","#0591",
"#0590","#0590","#058F","#058F","#058F","#058E","#05AE","#05AE","#05AD","#05AD",
"#05AD","#05AC","#05AC","#05AB","#05CB","#05CB","#05CA","#05CA","#05CA","#05C9",
"#05C9","#05C8","#05E8","#05E8","#05E7","#05E7","#05E6","#05E6","#05E6","#05E5",
"#05E5","#0604","#0604","#0604","#0603","#0603","#0602","#0602","#0601","#0621",
"#0621","#0620","#0620","#0620","#0620","#0E20","#0E20","#0E40","#1640","#1640",
"#1E40","#1E40","#2640","#2640","#2E40","#2E60","#3660","#3660","#3E60","#3E60",
"#3E60","#4660","#4660","#4E60","#4E80","#5680","#5680","#5E80","#5E80","#6680",
"#6680","#6E80","#6EA0","#76A0","#76A0","#7EA0","#7EA0","#86A0","#86A0","#8EA0",
"#8EC0","#96C0","#96C0","#9EC0","#9EC0","#A6C0","#AEC0","#AEC0","#B6E0","#B6E0",
"#BEE0","#BEE0","#C6E0","#C6E0","#CEE0","#CEE0","#D6E0","#D700","#DF00","#DEE0",
"#DEC0","#DEA0","#DE80","#DE80","#E660","#E640","#E620","#E600","#E5E0","#E5C0",
"#E5A0","#E580","#E560","#E540","#E520","#E500","#E4E0","#E4C0","#E4A0","#E480",
"#E460","#EC40","#EC20","#EC00","#EBE0","#EBC0","#EBA0","#EB80","#EB60","#EB40",
"#EB20","#EB00","#EAE0","#EAC0","#EAA0","#EA80","#EA60","#EA40","#F220","#F200",
"#F1E0","#F1C0","#F1A0","#F180","#F160","#F140","#F100","#F0E0","#F0C0","#F0A0",
"#F080","#F060","#F040","#F020","#F800"];

function add_port(port, index)
{
	port_list[index] = port;
	/* Since add_port will be called asynchronously,
	 * we are generating dropdown list here 
	 */
	html_dropdown_list_clean_insert(port_list);
	html_button_enable("id_btn_scan");
}

/*Port list will be added to port_list[] asynchronously*/
function get_serial_ports(){
	let i = 0;
	/* The list will be returned asynchronously */
	SerialPort.list(function (err, ports) {
		ports.forEach(function(port) {
			if(debug == true){
				message = "[port : "+i+"] [ "+port.comName+" ]"
				console.log(message);
			}
			add_port(port.comName, i)
			i += 1;
		});
	});
}

function open_serial_port(port_name){
	if(debug == true){
		msg = "Opening Serial Monitor : " + port_name;
		console.log(msg);
	}
	ser_port = new SerialPort(port_name, 9600);
	readline = SerialPort.parsers.Readline;
	serial_parser = new readline();
	ser_port.pipe(serial_parser);

	ser_port.on("open", serial_open);
	serial_parser.on("data", html_serial_data_display);
	ser_port.on("close", serial_close);
	ser_port.on("error", serial_error);

}

function serial_open()
{
	if(debug == true){
		message = "serial port opened";
		console.log(message);
	}

	document.getElementById("id_btn_connect").innerHTML = "Disconnect";
	serial_status = CONNECTED;
	html_button_enable("id_btn_connect");
}

function serial_close()
{
	message = "serial port closed"; 
	if(debug == true){
		console.log(message);
	}
	//alert(message);
	document.getElementById("id_btn_connect").innerHTML = "Connect";
	serial_status = DISCONNECTED;
	html_button_enable("id_btn_connect");
	scan_serial_ports();
	html_textarea_append('id_serial_reader', "[ serial port disconnected ]\n");
}

function serial_error(error)
{
	alert(error);
	document.getElementById("id_btn_connect").innerHTML = "Connect";
	serial_status = DISCONNECTED;
	html_button_enable("id_btn_connect");
	scan_serial_ports();
}

function html_input_clear(id)
{
    document.getElementById(id).value = "";
}

function html_input_read(id)
{
    data = document.getElementById(id).value;
	return data;
}

function html_textarea_clear(id)
{
    document.getElementById(id).value = "";
	html_textarea_scroll(id);
}

function html_textarea_read(id){
    data = document.getElementById(id).value;
	return data;
}

/*overwrite existing contents*/
function html_textarea_overwrite(id, data)
{
	html_textarea_clear(id);
    document.getElementById(id).value = data;
	html_textarea_scroll(id);
}

function html_textarea_append(id, data)
{
    document.getElementById(id).value += data;
	html_textarea_scroll(id);
}

/* autoscroll text area on feed */
function html_textarea_scroll(id){
    document.getElementById(id).scrollTop = document.getElementById(id).scrollHeight
}

function update_left_grid(pixel_reading_array)
{
    var i, tmp;
    var index = "";
    var pixel_id = "";
    
    
    dis="pixel[0] = "+pixel_reading_array[0];
	console.log(dis);
    /*
    dis="pixel[1] = "+pixel_reading_array[1];
	console.log(dis);
    dis="pixel[2] = "+pixel_reading_array[2];
	console.log(dis);
    tmp=pixel_reading_array.length;
    dis="pixel_reading_array.length = "+tmp.toString();
	console.log(dis);
    */

    var red=0;
    var green=128;
    var blue=0;
    var color;

    for(i=1; i<pixel_reading_array.length; i++){

        if(i>64){
            break;
        }
        tmp = i;
        index = tmp.toString();
        pixel_id = "pxL_"+index;
        var element = document.getElementById(pixel_id);
        var temperature = Number(pixel_reading_array[i]);
       
        if( temperature > 30 ){ //HOT - RED
            red = Math.floor(temperature) + (((Math.floor(temperature)/4) * 40)%255);
            blue = 0;
            green = 0;
            if(red > 255){
                red = 255;
            }
            blue = 0;
        }else{ //COLD - BLUE
            red = 0;
            blue = Math.floor(temperature) + ((Math.floor(temperature)/4) * 40)%255;
            green = 0;
            if(blue > 255){
                blue = 255;
            }

        }
        
        color=rgb2hex(red,green,blue);
        element.style.backgroundColor=color;
        element.innerText = pixel_reading_array[i]; 
    }

}


function update_right_grid(pixel_reading_array)
{
    var i, tmp;
    var index = "";
    var pixel_id = "";
    
    
    dis="pixel[0] = "+pixel_reading_array[0];
	console.log(dis);
    /*
    dis="pixel[1] = "+pixel_reading_array[1];
	console.log(dis);
    dis="pixel[2] = "+pixel_reading_array[2];
	console.log(dis);
    tmp=pixel_reading_array.length;
    dis="pixel_reading_array.length = "+tmp.toString();
	console.log(dis);
    */

    for(i=1; i<pixel_reading_array.length; i++){

        if(i>64){
            break;
        }

        tmp = i;
        index = tmp.toString();
        pixel_id = "pxR_"+index;
        var element = document.getElementById(pixel_id);
        element.innerText = pixel_reading_array[i]; 
    }

}

function html_serial_data_display(data)
{
	/*write to text area*/
    var incoming_str = data.toString();
    var ret = incoming_str.includes("GRID_EYE");

    if(ret == false){
        return;
    }
	
    console.log("Grid Eye Data Arrived\n");

    /* Incoming Data Ordering */
    /*
        1   2   3   4   5   6   7   8
        9   10  11  12  13  14  15  16
        
        .   .   .   .   .   .   .   . 
        
        .   .   .   .   .   .   .   .
        
        57  58  59  60  61  62  63  64   
     
     */
    var grid_eye_values = incoming_str.split("#");

    update_left_grid(grid_eye_values);
    update_right_grid(grid_eye_values);
    //html_textarea_append('id_serial_reader', data);
}

function html_insert_between_tags(id, data)
{
	document.getElementById(id).innerHTML = data;
}

function html_clear_dropdown_list()
{
	if(debug == true){
		console.log("html_clear_dropdown_list()");
	}

	/*Crear Port List*/
	port_list = [];
	list = '';
	html_insert_between_tags("id_select_serial_ports", list);
}
function html_button_disable(id)
{
    document.getElementById(id).disabled = true;
}

function html_button_enable(id){
    document.getElementById(id).disabled = false;
}

function html_dropdown_list_clean_insert(array)
{
	if(debug == true){
		console.log("html_dropdown_list_clean_insert()");
	}

	list = '';
	list += '<option selected>\< select serial port \></option>';

	for(i=0; i<array.length; i++){
		list += '<option>'+array[i]+'</option>';
		if(debug == true){
			msg = "[ port : "+array[i]+" ]";
			console.log(msg);
		}
	}

	drop_down_id = "id_select_serial_ports"
	html_insert_between_tags(drop_down_id, list);
}

function scan_serial_ports(){
	if(debug == true){
		console.log("scan_serial_ports()");
	}

	html_button_disable("id_btn_scan");

	/*Crear Port List*/
	port_list = [];

	html_clear_dropdown_list();

	list = '';
	list += '<option selected>\< scanning ...\></option>';

	html_insert_between_tags("id_select_serial_ports", list);
	get_serial_ports();
}

function send_serial_data(data)
{
	ser_port.write(data, function(error) {
		if (error) {
			alert("serial write error");
			console.log('error serial write()', error.message);
			return;
		}
		console.log('sent data via serial port');
	});
}

function check_serial_port_status(){
	if(serial_status == IN_PROGRESS){
		alert("serial port is being connected, try sending after some time");
		return -1;
	}

	if(serial_status != CONNECTED){
		alert("no serial port connected");
		return -1;
	}

	return 0;
}

function event_btn_send_sp()
{
	if(debug == true){
		console.log("event_btn_send_sp()");
	}

	if(check_serial_port_status()<0){
		return;
	}

	html_button_disable("id_btn_send");
	data = html_input_read("id_serial_writer");
	data = data + "\n";

	if(debug == true){
		message = "serial_write : "+data;
		console.log(message);
	}

	send_serial_data(data);
	html_input_clear("id_serial_writer");
	html_button_enable("id_btn_send");
}


function event_btn_scan_sp()
{
	if(debug == true){
		console.log("event_btn_scan_sp()");
	}
	html_button_disable("id_btn_scan");
	scan_serial_ports();
}

function connect_serial_port()
{
	port = document.getElementById("id_select_serial_ports");
	selected_port = port.options[port.selectedIndex].value;

	if(debug == true){
		message = "[ SELECTED PORT : " + selected_port + " ] [ Index : " + port.selectedIndex + " ]";
		console.log(message);
	}

	if(selected_port == "< select serial port >"){
		alert("select proper serial port from the dropdown");
		serial_status = DISCONNECTED;
		html_button_enable("id_btn_connect");
		return;
	}

	open_serial_port(selected_port);
}

function event_btn_connect_sp()
{
	if(debug == true){
		console.log("event_btn_connect_sp()");
	}

	html_button_disable("id_btn_connect");

	if(serial_status == IN_PROGRESS){
		return;
	}else if(serial_status == CONNECTED){
		serial_status = IN_PROGRESS;
		disconnect_serial_port();
		return;
	}else if(serial_status == DISCONNECTED){
		serial_status = IN_PROGRESS;
		connect_serial_port();
		return;
	}

}

function disconnect_serial_port()
{
	if(debug == true){
		console.log("disconnect_serial_port()");
	}

	ser_port.close();
	document.getElementById("id_btn_connect").innerHTML = "Connect";
	serial_status = DISCONNECTED;
    html_button_enable("id_btn_connect");

}

function sleep(milliseconds){
	return new Promise(resolve=> setTimeout(resolve, milliseconds));
}

async function sleep_test(){
	alert("Going to sleep for 10 seconds");
	await sleep(10000);
	alert("Woke up after 10 seconds of nice rest!!");
}

function rgb2hex(r,g,b) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1) r = "0" + r;
    if (g.length == 1) g = "0" + g;
    if (b.length == 1) b = "0" + b;

    var ret = "#" + r + g + b;
    return ret
}

function random_number(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate_grid_1()
{
    var i, div, index;
    var red=255;
    var green=128;
    var blue=0;
    var color=rgb2hex(red,green,blue);
    var pixel_id = "";
    var element = document.getElementById("px_main_1");
    var c_ctr=0;
    var pixel_val = "";
    for(i=1;i<=64;i++){
        div = document.createElement("div");
        div.className = "c8_grid_item";
        index = i.toString();
        pixel_id = "pxL_"+ index;
        div.id = pixel_id;
        
        if(i<10){
            pixel_val="00"+index;
        }else{
            pixel_val="0"+index;
        }

        div.innerText=pixel_val;



        if( c_ctr == 1 ){
            red = red - 40;

            if(red < 0) {
                red = 255;
            }
            
            color=rgb2hex(red,green,blue);
            //color="#C00"
        }else{
            blue = (blue + 40) % 255;
            color=rgb2hex(red,green,blue);
            //color="#8F0"
        }
       
        //var r = random_number(0,254); 
        //color = cam_colors[r];
        div.style.backgroundColor=color;
        element.appendChild(div);
        c_ctr = (c_ctr + 1 ) % 4;
    }
   
    console.log(cam_colors.length);
}

function generate_grid_2()
{
    var i, div, index;
    var color="#FFF";
    var pixel_id = "";
    var pixel_val = "";
    var element = document.getElementById("px_main_2");
    for(i=1;i<=64;i++){
        div = document.createElement("div");
        div.className = "c8_grid_item";
        index = i.toString();
        pixel_id = "pxR_"+ index;
        
        pixel_val="255"; 

        div.id = pixel_id;
        div.innerText=pixel_val;

        color="#FFF"

        div.style.backgroundColor=color;
        element.appendChild(div);
    }
}

generate_grid_1();
generate_grid_2();
scan_serial_ports();
