// TODO:
// pociatocna vlnova dlzka je nastvena rucne, uhol to iste
// style aspon trosku :D
// zmena hodnoty vlnovej dlzky - eventListener?
// skalovanie vlnovej dlzky na pixely?


// skalovanie osy, aby to bolo nejako rozumne viditelne
var axisScale = 0.02
var wavelength = 520;
var waveAngle = 20;

// create a wrapper around native canvas element (with id="canvas")
var canvas = new fabric.Canvas('canvas');

//objektova vlna
var objectWave  = new Wave(wavelength,waveAngle);
objectWave.init();

//referencna vlna
var referenceWave  = new Wave(wavelength,0);
referenceWave.init();

//hologram
var holo = new Hologram();
holo.init();

function wavelengthValueChanged(newValue)
{
    document.getElementById("wavelengthValue").innerHTML=newValue;
    //KATASTROFA
    objectWave.changeWaveLength(newValue);
    referenceWave.changeWaveLength(newValue);
    wavelength = newValue;
    holo.computeInterference();
}

function angleValueChanged(newAngle){
    document.getElementById("angleValue").innerHTML=newAngle;
    objectWave.changeAngle( newAngle);
    waveAngle = newAngle;
    holo.computeInterference();
}

function Wave(wavelength_, waveAngle_){

    var objectList = [];
    var group  = null;
    var waveWrapper = null;

    this.wavelength = wavelength_ * axisScale;
    this.waveAngle = waveAngle_;


    this.init  = function(){

        waveWrapper = new fabric.Rect({
            //stroke: 'black',
            //strokeWidth: 2,
            left: 200,
            top: 70,
            width: 300,
            height: 20,
            fill: 'white'
        });

        objectList.push(waveWrapper);


       this.fillWave();

        group = new fabric.Group(objectList,{
            left: 200,
            top: 200,
            angle: this.waveAngle
        });

        canvas.add(group);
    };

    this.fillWave = function () {
        var currentX = waveWrapper.left;
        var waveRight = waveWrapper.left +  waveWrapper.width;

        while (currentX < waveRight ){
            var waveLine =  new fabric.Rect({
                left: currentX - 2 ,
                top: waveWrapper.top ,
                fill: 'red',
                width: 4,
                height: 20

            });
            objectList.push(waveLine);

            currentX +=  this.wavelength;


        }
    }.bind(this);

    this.changeAngle = function (newAngle) {
        if(group != null){
            this.waveAngle = newAngle;
            group.angle = newAngle;
        }
        canvas.renderAll();
    }.bind(this);


    this.changeWaveLength = function (newWavelength) {

        //tak toto je fakt KOKOTINA
        var length = objectList.length;
        for (var i = 1; i < length; i++) {
            group.remove(group.item(1));

        }
        this.wavelength = newWavelength * axisScale;
        this.fillWave();


        canvas.renderAll();
    }.bind(this);

}

function Hologram(){

    var hologramRect = null;
    var  interferenceMaximum = -1;
    var numOfMaximas = 0;


    this.init = function () {

        hologramRect  = new fabric.Rect({
            stroke: 'black',
            strokeWidth: 2,
            left: 200,
            top: 90,
            width: 230,
            height: 70,
            fill: 'white',
            angle:90
        });

        this.computeInterference();

        canvas.add(hologramRect);
    }

    this.computeInterference = function () {

        interferenceMaximum = (wavelength*axisScale) / Math.sin(waveAngle * (Math.PI / 180) );
        numOfMaximas = Math.floor(hologramRect.width / interferenceMaximum) ;

        var colors = {
            0: "white"
        };

        var colorStep = 1/ (numOfMaximas*2);
        for(var n = 1; n < (numOfMaximas*2); n++){

            //test ci je n lyche alebo sude
            if(n === parseFloat(n)? !(n%2) : void 0)
                colors[n*colorStep] = "white";
            else
                colors[n*colorStep] = "black";

        }
        colors[1] = "white";

        hologramRect.setGradient('fill', {
            x1: 0,
            y1: hologramRect.height,
            x2: hologramRect.width,
            y2: hologramRect.height,
            colorStops: colors
        });
    }

}






//k=2*pi/lambda;
// y=2*IO*(1+cos(k*x-sin(fi)));
//maxima: m*lambda/sin(angle)









