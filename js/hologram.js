// TODO:
// pociatocna vlnova dlzka je nastvena rucne, uhol to iste
// style aspon trosku :D
// zmena hodnoty vlnovej dlzky - eventListener?
// skalovanie vlnovej dlzky na pixely?


// skalovanie osy, aby to bolo nejako rozumne viditelne
var axisScale = 0.02;
var wavelength = 520;
var waveAngle = 20;

// create a wrapper around native canvas element
var recordingCanvas = new fabric.Canvas('recordingCanvas');
var reconstructionCanvas = new fabric.Canvas('reconstructionCanvas');

//hologram
var holo = new Hologram();
holo.init(recordingCanvas);
holo.addToCanvas(recordingCanvas);
holo.addToCanvas(reconstructionCanvas);


//objektova vlna - zaznam
var recObjectWave  = new Wave(wavelength,waveAngle,recordingCanvas);
recObjectWave.init(recordingCanvas.width/2,(recordingCanvas.height/2));

//referencna vlna - zaznam
var recReferenceWave  = new Wave(wavelength,0,recordingCanvas);
recReferenceWave.init(recordingCanvas.width/2,(recordingCanvas.height/2));

//referencna vlna  - rekonstrukcia
var reconReferenceWave  = new Wave(wavelength,0,reconstructionCanvas);
reconReferenceWave.init(recordingCanvas.width/2,(recordingCanvas.height/2))

//left pre vlny za hologramom
var left_ = reconstructionCanvas.width/2 - (300 + holo.getHologramHeight());
//aby vlna nezacinala za okrajom canvasu
left_  = (left_ < 0) ? 0 : left_;
console.log(left_);
//referencna vlna pokracovanie - rekonstrukcia
var reconReferenceWaveContinue  = new Wave(wavelength,0,reconstructionCanvas);
reconReferenceWaveContinue.init(left_,(reconstructionCanvas.height/2));

//objektova vlna - rekonstrukcia
var reconObjectWave  = new Wave(wavelength,waveAngle+180,reconstructionCanvas);
reconObjectWave.init(left_+300,(reconstructionCanvas.height/2) );
//var reconObjectWave  = new Wave(wavelength,waveAngle,reconstructionCanvas);
//reconObjectWave.init(left_,(reconstructionCanvas.height/2) - holo.getHologramWidth()/2);

//konjugovana vlna - rekonstrukcia
var reconConjugatedWave  = new Wave(wavelength,(-1)*waveAngle +180,reconstructionCanvas);
reconConjugatedWave.init(left_+300,(reconstructionCanvas.height/2) +40);


function wavelengthValueChanged(newValue)
{
    document.getElementById("wavelengthValue").innerHTML=newValue;
    //zaznam
    recObjectWave.changeWaveLength(newValue);
    recReferenceWave.changeWaveLength(newValue);
    //rekonstrukcia
    reconReferenceWave.changeWaveLength(newValue);
    reconReferenceWaveContinue.changeWaveLength(newValue);
    reconObjectWave.changeWaveLength(newValue);
    reconConjugatedWave.changeWaveLength(newValue);

    wavelength = newValue;
    holo.computeInterference();

    reconstructionCanvas.renderAll();
    recordingCanvas.renderAll();
}

function angleValueChanged(newAngle){
    document.getElementById("angleValue").innerHTML=newAngle;
    recObjectWave.changeAngle( newAngle);

    reconObjectWave.changeAngle(newAngle-180);
    reconConjugatedWave.changeAngle((-1)*newAngle - 180);

    waveAngle = newAngle;
    holo.computeInterference();

    reconstructionCanvas.renderAll();
    recordingCanvas.renderAll();
}

function Wave(wavelength_, waveAngle_,canvas){

    var objectList = [];
    var group  = null;
    var waveWrapper = null;

    this.wavelength = wavelength_ * axisScale;
    this.waveAngle = waveAngle_;


    this.init  = function(left_,top_){

        waveWrapper = new fabric.Rect({
            //stroke: 'black',
            //strokeWidth: 2,
            left: left_,
            top: top_,
            width: 300,
            height: 20,
            fill: 'white'
        });

        objectList.push(waveWrapper);

       this.fillWave();

        group = new fabric.Group(objectList,{
            left: left_,
            top: top_,
            angle: this.waveAngle
        });

        canvas.add(group);

        //z-index
        group.moveTo(-10);
    };

    this.getWaveWidth = function () {
      return waveWrapper.width;
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
            //group.rotate(newAngle);
        }

    }.bind(this);


    this.changeWaveLength = function (newWavelength) {

        //tak toto je fakt...
        var length = objectList.length;
        for (var i = 1; i < length; i++) {
            group.remove(group.item(1));

        }
        this.wavelength = newWavelength * axisScale;
        this.fillWave();


    }.bind(this);

}

function Hologram(){


    var hologramRect = null;
    var  interferenceMaximum = -1;
    var numOfMaximas = 0;


    this.init = function (canvas) {

        hologramRect  = new fabric.Rect({
            stroke: 'black',
            strokeWidth: 2,
            left: canvas.width/2,
            top: (canvas.height/2)-(230/2),
            width: 230,
            height: 70,
            fill: 'white',
            angle:90
        });


        this.computeInterference();
    };

    this.addToCanvas = function (canvas) {
        canvas.add(hologramRect);

    };

    this.getHologramWidth = function () {
      return hologramRect.width;
    };

    this.getHologramHeight = function () {
        return hologramRect.height;
    };

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
