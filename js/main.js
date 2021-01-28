import { gameData } from "./../archivos/questions.js";

var countries = [];
var corrects;
var idInterval;
var contadorInterval = 0;
var contadorIntentos = 0;
var resultCountries = [];
var resultTime = [["Intentos", "Tiempo"]];

var templateCountry = document.getElementById("countryTemp");
var templateCity = document.getElementById("cityTemp");

var section1_1 = document.querySelector(".section1_1");
var section1_2 = document.querySelector(".section1_2");

var map;
var marker;

google.charts.load('current', {'packages':['corechart']});


window.onload = () => {
    map = L.map('map', {
        center: [51.102, -0.09],
        zoom: 10,
        watch: true
    });
    marker = L.marker([51.102, -0.09]);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    saveTime();
}


var buttonStartGame = document.getElementById("newGame")
buttonStartGame.addEventListener("click", buildBody);

/**
 * Inserta texto en el campo del tiempo
 *
 * @param {*} text
 */
function changeTextTime(text){
    document.getElementById("time").innerHTML = text;
}


/**
 *  Recoge aleatoriamente los paises y ciudades y llaman a los métodos que construyen dichos elementos
 *
 */
function buildBody(){
    var countriesIndex = [];
    countries = [];
    corrects = 0;
    clearNode(section1_1);
    clearNode(section1_2);
    buttonStartGame.disabled = true

    while(countries.length < 5){
        var pos = Math.floor(Math.random() * gameData.countries.length);
        if(!countriesIndex.includes(pos)){
            countriesIndex.push(pos);
            countries.push(gameData.countries[pos]);
        }
    }

    countries.sort(function(a, b){
        return a.code - b.code;
    });

    countriesIndex.forEach((index) => {
        var pos = Math.floor(Math.random() * gameData.countries[index].cities.length);
        createCities(gameData.countries[index].cities[pos], gameData.countries[index].code)
    });

    idInterval = setInterval(() => {
        contadorInterval++;
        changeTextTime("Tiempo: "+contadorInterval + "s");
    }, 1000);

    createCountries();
}


/**
 * Resetea las variables a su valor inicial
 *
 */
function endGame(){
    contadorIntentos++;
    saveTime();
    contadorInterval = 0;
    clearInterval(idInterval);
    buttonStartGame.disabled = false;
}

/**
 * Limpia el cuerpo del nodo recogido
 *
 * @param {*} node
 */
function clearNode(node){
    while (node.firstChild) {
        node.removeChild(node.lastChild);
    }
}


/**
 * Clona el template de ciudades y le inserta los datos para despues mostrarlo
 *
 * @param {*} city
 * @param {*} countryName
 */
function createCities(city, countryName) {
    var node = templateCity.content.querySelector(".city");
    var cityNode = node.cloneNode(true);

    cityNode.getElementsByTagName("span")[0].innerHTML = city.name;
    cityNode.classList.add(countryName);
    $(cityNode).data("location", city.location);

    section1_1.appendChild(cityNode);

    $(cityNode).draggable({
        revert: "invalid",
    });
}


/**
 * Clona el template de paises y le inserta los datos para despues mostrarlo
 *
 */
function createCountries(){
    countries.forEach((country) => {
        var node = templateCountry.content.querySelector(".country");
        var countryNode = node.cloneNode(true);

        countryNode.getElementsByTagName("span")[0].innerHTML = country.name;
        
        section1_2.appendChild(countryNode);

        $(countryNode.querySelector(".finish")).droppable({
            accept: "."+country.code,
            drop: function () {
                $(this).addClass("correct");
                $("."+country.code).draggable('destroy');
                changeLocation($("."+country.code).data("location"));
                counting();
                google.charts.setOnLoadCallback(drawChart(country.name));
            }
        });

    });
}

/**
 * Inserta los datos recogidos en el PieChart y lo muestra
 *
 * @param {*} row
 */
function drawChart(row) {
    var contained = resultCountries.find(result => result.name === row);

    if(contained != undefined){
        resultCountries.map((result) => {
            if(result.name === row) result.value++;
        });
    }else{
        resultCountries.push({"name": row, "value": 1});        
    }

    var resultToShow = [];
    resultCountries.forEach((result) => {
        resultToShow.push([result.name, result.value]);
    });

    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Topping');
    data.addColumn('number', 'Slices');
    data.addRows(resultToShow);

    
    var options = {'title':'Ubicaciones localizadas correctamente'};

    var chart = new google.visualization.PieChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}


/**
 * Inserta los datos en el LineChart una vez se acaba el juego y sobreescribe el LineChart
 *
 */
function saveTime(){
    var options = {
        hAxis: {
          title: 'Intentos',
          textStyle: {
            color: '#01579b',
            fontSize: 16,
            fontName: 'Arial',
            bold: false,
            italic: true
          },
          titleTextStyle: {
            color: '#01579b',
            fontSize: 20,
            fontName: 'Arial',
            bold: true,
            italic: true
          }
        },
        vAxis: {
          title: 'Tiempo',
          textStyle: {
            color: '#01579b',
            fontSize: 16,
            bold: false
          },
          titleTextStyle: {
            color: '#01579b',
            fontSize: 20,
            bold: true
          }
        },
        colors: ['#a52714', '#097138'],
        title: 'Tiempo realizado',
        curveType: 'function',
      };

    var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));
    var data;

    if(contadorIntentos == 0){
        data = new google.visualization.DataTable();
        data.addColumn('number', 'Intentos');
        data.addColumn('number', 'Tiempo');
    }else{
        resultTime.push([contadorIntentos, contadorInterval]);
        data = new google.visualization.arrayToDataTable(resultTime);
    }
    
    chart.draw(data, options);

}

/**
 * Inserta una nueva ubicación en el mapa, con su punto y realiza la animación de volar hasta el mismo
 *
 * @param {*} location
 */
function changeLocation(location){
    
    if(marker != null) map.removeLayer(marker);
    
    marker = new L.marker([location[0], location[1]]);
    marker.addTo(map);
    map.flyTo([location[0], location[1]]);

}

/**
 * Cuando se han colocado los 5 paises correctamente, llama al método de endGame()
 *
 */
function counting(){
    corrects++;
    if(corrects == 5){
        endGame();
    }
}
