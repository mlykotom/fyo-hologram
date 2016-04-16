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

recordingCanvas.on('mouse:over', canvasOnMouseOver);
recordingCanvas.on('mouse:out',canvasOnMouseOut);

reconstructionCanvas.on('mouse:over', canvasOnMouseOver);
reconstructionCanvas.on('mouse:out',canvasOnMouseOut);

//hologram
var holo = new Hologram();
holo.init(recordingCanvas,"holo");
holo.addToCanvas(recordingCanvas);
holo.addToCanvas(reconstructionCanvas);


//objektova vlna - zaznam
var recObjectWave = new Wave(wavelength, waveAngle, recordingCanvas);
recObjectWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2),"wave","Objektova vlna");

//referencna vlna - zaznam
var recReferenceWave = new Wave(wavelength, 0, recordingCanvas);
recReferenceWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2),"wave","Referenční vlna");

//referencna vlna  - rekonstrukcia
var reconReferenceWave = new Wave(wavelength, 0, reconstructionCanvas);
reconReferenceWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2),"wave","Referenční vlna")

//left pre vlny za hologramom
var left_ = reconstructionCanvas.width / 2 - (300 + holo.getHologramHeight());
//aby vlna nezacinala za okrajom canvasu
left_ = (left_ < 0) ? 0 : left_;
console.log(left_);
//referencna vlna pokracovanie - rekonstrukcia
var reconReferenceWaveContinue = new Wave(wavelength, 0, reconstructionCanvas);
reconReferenceWaveContinue.init(left_, (reconstructionCanvas.height / 2),"wave","Referenční vlna");

//objektova vlna - rekonstrukcia
var reconObjectWave = new Wave(wavelength, waveAngle + 180, reconstructionCanvas);
reconObjectWave.init(left_ + 300, (reconstructionCanvas.height / 2),"wave","Objektova vlna");
reconObjectWave.caption.rotate(180);

//konjugovana vlna - rekonstrukcia
var reconConjugatedWave = new Wave(wavelength, (-1) * waveAngle + 180, reconstructionCanvas);
reconConjugatedWave.init(left_ + 300, (reconstructionCanvas.height / 2) + 40,"wave","Konjugovana vlna");
reconConjugatedWave.caption.rotate(180);

function canvasOnMouseOver(e){

    if(e.target.get("id") == "wave"){
        e.target.item(0).visible = true;
    }
    e.target.canvas.renderAll();
    //recordingCanvas.renderAll();
}

function canvasOnMouseOut(e){

    if(e.target.get("id") == "wave"){
        e.target.item(0).visible = false;
    }

    e.target.canvas.renderAll();
}

function wavelengthValueChanged(newValue) {
    document.getElementById("wavelengthValue").innerHTML = newValue;
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

function angleValueChanged(newAngle) {
    document.getElementById("angleValue").innerHTML = newAngle;
    recObjectWave.changeAngle(newAngle);

    reconObjectWave.changeAngle(newAngle - 180);
    reconConjugatedWave.changeAngle((-1) * newAngle - 180);

    waveAngle = newAngle;
    holo.computeInterference();

    reconstructionCanvas.renderAll();
    recordingCanvas.renderAll();
}

function Wave(wavelength_, waveAngle_, canvas) {

    var objectList = [];
    var group = null;
    var waveWrapper = null;

    this.wavelength = wavelength_ * axisScale;
    this.waveAngle = waveAngle_;
    this.caption = null;

    this.init = function (left_, top_,id_,caption_) {

        waveWrapper = new fabric.Rect({
            //stroke: 'black',
            //strokeWidth: 2,
            left: left_,
            top: top_,
            width: 300,
            height: 20,
            fill: 'white',

        });



       this.caption = new fabric.Text(caption_, { left: left_+100, top: top_+20,fontSize: 25 });
        this.caption.visible = false;
        objectList.push(this.caption);
        objectList.push(waveWrapper);

        this.fillWave();

        group = new fabric.Group(objectList, {
            left: left_,
            top: top_,
            angle: this.waveAngle,
            id: id_
        });

        group.set('selectable', false); //unselectable

        canvas.add(group);

        //z-index
        group.moveTo(-10);
    }.bind(this);

    /**
     * Prevedie vlnovu dlzku na farbu
     * http://scienceprimer.com/javascript-code-convert-light-wavelength-color
     * @param wavelength
     * @returns {Array}
     */
    this.wavelengthToColor = function (wavelength) {

        var r, g, b, alpha, colorSpace, wl = wavelength, gamma = 1;

        if (wl >= 380 && wl < 440) {
            R = -1 * (wl - 440) / (440 - 380);
            G = 0;
            B = 1;
        } else if (wl >= 440 && wl < 490) {
            R = 0;
            G = (wl - 440) / (490 - 440);
            B = 1;
        } else if (wl >= 490 && wl < 510) {
            R = 0;
            G = 1;
            B = -1 * (wl - 510) / (510 - 490);
        } else if (wl >= 510 && wl < 580) {
            R = (wl - 510) / (580 - 510);
            G = 1;
            B = 0;
        } else if (wl >= 580 && wl < 645) {
            R = 1;
            G = -1 * (wl - 645) / (645 - 580);
            B = 0.0;
        } else if (wl >= 645 && wl <= 780) {
            R = 1;
            G = 0;
            B = 0;
        } else {
            R = 0;
            G = 0;
            B = 0;
        }

        // intensty is lower at the edges of the visible spectrum.
        if (wl > 780 || wl < 380) {
            alpha = 0;
        } else if (wl > 700) {
            alpha = (780 - wl) / (780 - 700);
        } else if (wl < 420) {
            alpha = (wl - 380) / (420 - 380);
        } else {
            alpha = 1;
        }

        //colorSpace[0] je farba
        colorSpace = ["rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")", R, G, B, alpha]

        return colorSpace;

    };

    this.getWaveWidth = function () {
        return waveWrapper.width;
    };

    this.fillWave = function () {
        var currentX = waveWrapper.left;
        var waveRight = waveWrapper.left + waveWrapper.width;


        while (currentX < waveRight) {
            var waveLine = new fabric.Rect({
                left: currentX - 2,
                top: waveWrapper.top,
                fill: this.wavelengthToColor(this.wavelength / axisScale)[0],
                width: 4,
                height: 20

            });
            objectList.push(waveLine);

            currentX += this.wavelength;


        }
    }.bind(this);

    this.changeAngle = function (newAngle) {
        if (group != null) {
            this.waveAngle = newAngle;
            group.angle = newAngle;

        }

    }.bind(this);


    this.changeWaveLength = function (newWavelength) {

        //tak toto je fakt...
        var length = objectList.length;
        for (var i = 0; i < length; i++) {
            group.remove(group.item(1));

        }
        this.wavelength = newWavelength * axisScale;
        this.fillWave();


    }.bind(this);

}

function Hologram() {


    var hologramRect = null;
    var interferenceMaximum = -1;
    var numOfMaximas = 0;


    this.init = function (canvas,id_) {

        hologramRect = new fabric.Rect({
            stroke: 'black',
            strokeWidth: 2,
            left: canvas.width / 2,
            top: (canvas.height / 2) - (230 / 2),
            width: 230,
            height: 70,
            fill: 'white',
            angle: 90,
            id: id_
        });

        hologramRect.set('selectable', false); //unselectable

        this.computeInterference();
    }.bind(this);

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

        interferenceMaximum = (wavelength * axisScale) / Math.sin(waveAngle * (Math.PI / 180));
        numOfMaximas = Math.floor(hologramRect.width / interferenceMaximum);

        var colors = {
            0: "white"
        };

        var colorStep = 1 / (numOfMaximas * 2);
        for (var n = 1; n < (numOfMaximas * 2); n++) {

            //test ci je n lyche alebo sude
            if (n === parseFloat(n) ? !(n % 2) : void 0)
                colors[n * colorStep] = "white";
            else
                colors[n * colorStep] = "black";

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
