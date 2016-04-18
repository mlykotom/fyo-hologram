$(window).resize(function () {
    handleResize();
});

var caption_font_size = 20;
var caption_char_px_half = 4;
var wave_step_width = 3;
var canvas_padding = 30;

/**
 * Global variables
 */
var axisScale = 0.02;
var wavelength = 520;
var waveAngle = 20;

/**
 * Recording canvas
 * @type {fabric.Canvas}
 */
var recordingCanvas = new fabric.Canvas('recordingCanvas');
recordingCanvas.on('mouse:over', canvasOnMouseOver);
recordingCanvas.on('mouse:out', canvasOnMouseOut);

/**
 * Reconstruction canvas
 * @type {fabric.Element}
 */
var reconstructionCanvas = new fabric.Canvas('reconstructionCanvas');
reconstructionCanvas.on('mouse:over', canvasOnMouseOver);
reconstructionCanvas.on('mouse:out', canvasOnMouseOut);

function handleResize() {
    var wrapper = $('#canvasWrapper');
    recordingCanvas.setWidth(wrapper.width() - canvas_padding);
    recordingCanvas.calcOffset();

    reconstructionCanvas.setWidth(wrapper.width() - canvas_padding);
    reconstructionCanvas.calcOffset();
}

handleResize();

/**
 * Hologram for both recording and reconstruction
 * @type {Hologram}
 */
var hologram = new Hologram();
hologram.init(recordingCanvas, "hologram");
hologram.addToCanvas(recordingCanvas);
hologram.addToCanvas(reconstructionCanvas);

/*************
 * Recording
 ************/

/**
 * Reference wave
 ** @type {Wave}
 */
var recordReferenceWave = new Wave(wavelength, waveAngle, recordingCanvas);
recordReferenceWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2), "recordReferenceWave", "Referenční vlna");

/**
 * Object wave
 ** @type {Wave}
 */
var recordObjectWave = new Wave(wavelength, 0, recordingCanvas);
recordObjectWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2), "recordObjectWave", "Objektová vlna", true);


/*************
 * Reconstruction
 ************/

//left for waves on the left half of canvas
var left_ = reconstructionCanvas.width / 2 - (300 + hologram.getHologramHeight());
//avoid values less then 0
left_ = (left_ < 0) ? 0 : left_;

/**
 * Reference wave
 * @type {Wave}
 */
var reconReferenceWave = new Wave(wavelength, waveAngle, reconstructionCanvas);
reconReferenceWave.init(recordingCanvas.width / 2, (recordingCanvas.height / 2), "reconReferenceWave", "Referenční vlna");

/**
 * Reference wave continuation
 * @type {Wave}
 */
var reconReferenceWaveContinue = new Wave(wavelength, waveAngle + 180, reconstructionCanvas);
reconReferenceWaveContinue.init(left_ + 300, (reconstructionCanvas.height / 2), "reconReferenceWaveContinue", "Referenční vlna");
reconReferenceWaveContinue.caption.rotate(180);

/**
 * Object wave
 * @type {Wave}
 */
var reconObjectWave = new Wave(wavelength, 0, reconstructionCanvas);
reconObjectWave.init(left_, (reconstructionCanvas.height / 2), "reconObjectWave", "Objektová vlna", true);


/**
 * Callback function, called when mouse is over object
 * @param e
 */function canvasOnMouseOver(e) {

    var regexp = /.*Wave.*/;
    if (e.target.get("id").match(regexp)) {
        //na indexe 0 je text
        e.target.item(0).visible = true;
    }
    e.target.canvas.renderAll();
}

/**
 * Callback function, called when mouse leaves object
 * @param e
 */
function canvasOnMouseOut(e) {

    var regexp = /.*Wave.*/;
    if (e.target.get("id").match(regexp)) {
        e.target.item(0).visible = false;
    }

    e.target.canvas.renderAll();
}

/**
 * Callback function, called when wavelength is changed
 * @param newValue
 */
function wavelengthValueChanged(newValue) {
    document.getElementById("wavelengthValue").innerHTML = newValue;
    //change wavelength of all waves
    recordObjectWave.changeWaveLength(newValue);
    recordReferenceWave.changeWaveLength(newValue);
    reconReferenceWave.changeWaveLength(newValue);
    reconReferenceWaveContinue.changeWaveLength(newValue);
    reconObjectWave.changeWaveLength(newValue);

    wavelength = newValue;
    hologram.computeInterference();

    reconstructionCanvas.renderAll();
    recordingCanvas.renderAll();
}
/**
 * Callback function, called when angle is changed
 * @param newAngle
 */
function angleValueChanged(newAngle) {
    document.getElementById("angleValue").innerHTML = newAngle;

    //change wavelength of all relevant waves - object wave not affected
    recordReferenceWave.changeAngle(newAngle);
    reconReferenceWave.changeAngle(newAngle);
    reconReferenceWaveContinue.changeAngle(newAngle - 180);

    waveAngle = newAngle;
    hologram.computeInterference();

    reconstructionCanvas.renderAll();
    recordingCanvas.renderAll();
}

function Wave(wavelength_, waveAngle_, canvas) {

    var options_circle = {
        radius: 30,
        stroke: 2
    };

    var __circle_radius_stroke = (options_circle.radius + options_circle.stroke);
    var objectList = [];
    var group = null;
    var waveWrapper = null;
    var width = 300;
    var height = 20; // TODO calculate based on object

    this.wavelength = wavelength_ * axisScale;
    this.waveAngle = waveAngle_;
    this.caption = null;

    /**
     * Creation of hologram object
     * @param top_
     * @param left_
     * @param id_
     * @returns {*}
     */
    this.createCircle = function (top_, left_, id_) {
        var left, strokeDash = [];
        if (id_ == "recordObjectWave") {
            left = left_ + width - __circle_radius_stroke;
        }
        else if (id_ == "reconObjectWave") {
            left = left_ - __circle_radius_stroke;
            strokeDash = [5, 5];
        }
        else {
            return;
        }

        var circle = new fabric.Circle({
            radius: options_circle.radius,
            fill: 'white',
            left: left,
            top: top_,
            strokeWidth: options_circle.stroke,
            strokeDashArray: strokeDash,
            stroke: 'black',
            id: "circle",
            selectable: false
        });

        return circle;
    };

    /**
     * Object initialization
     * @type {(function(this:Wave))|Function}
     */
    this.init = function (left_, top_, id_, caption_, circleCreating) {

        waveWrapper = new fabric.Rect({
            left: left_,
            top: top_ - __circle_radius_stroke,
            width: width,
            height: __circle_radius_stroke * 2,
            fill: 'transparent'
        });

        this.caption = new fabric.Text(caption_, {
            left: waveWrapper.left + (waveWrapper.width / 2) - (caption_.length * caption_char_px_half),
            top: waveWrapper.top + waveWrapper.height,
            fontSize: caption_font_size,
            id: "caption",
            visible: false
        });

        objectList.push(this.caption); // must be first
        objectList.push(waveWrapper);
        this.fillWave();

        if (circleCreating) {
            var circle = this.createCircle(waveWrapper.top, left_, id_);
            top_ -= __circle_radius_stroke;
            objectList.push(circle);
        }


        group = new fabric.Group(objectList, {
            left: left_,
            top: top_,
            angle: this.waveAngle,
            id: id_,
            originX: 'left',
            originY: 'top',
            centeredRotation: false,
            selectable: false
        });

        canvas.add(group);
        group.moveTo(-1);   //z-index
    }.bind(this);

    /**
     * Transforms wavelength to color
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

        //colorSpace[0] == color
        colorSpace = ["rgba(" + (R * 100) + "%," + (G * 100) + "%," + (B * 100) + "%, " + alpha + ")", R, G, B, alpha];

        return colorSpace;

    };

    /**
     * Creates wave elements (a.k.a rectangles) with appropriate color
     * @type {(function(this:Wave))|Function}
     */
    this.fillWave = function () {
        var currentX = waveWrapper.left;
        var waveRight = waveWrapper.left + waveWrapper.width;

        var listOfWaveLines = [];
        while (currentX < waveRight) {
            var waveLine = new fabric.Rect({
                left: currentX - 2,
                top: waveWrapper.top,
                fill: this.wavelengthToColor(this.wavelength / axisScale)[0],
                width: wave_step_width,
                height: waveWrapper.height

            });
            listOfWaveLines.push(waveLine);
            currentX += this.wavelength;
        }
        var waveLinesGroup = new fabric.Group(listOfWaveLines, {
            id: 'waveLines'
        });
        objectList.push(waveLinesGroup);

    }.bind(this);

    /**
     * Sets new wave angle
     * @type {(function(this:Wave))|Function}
     */
    this.changeAngle = function (newAngle) {
        if (group != null) {
            this.waveAngle = newAngle;
            group.setAngle(newAngle);
        }
    }.bind(this);


    /**
     * Sets new wavelength and renders the wave
     * @type {(function(this:Wave))|Function}
     */
    this.changeWaveLength = function (newWavelength) {
        var circle;
        group.forEachObject(function (o) {
            // select circle if awailable
            if (o.get("id") == "circle") {
                circle = o;
            }

            if (o.get("id") == "caption" || o.type != 'group') return;

            group.remove(o);
        });
        this.wavelength = newWavelength * axisScale;
        this.fillWave();
        // add it as last so that it is on top of waves
        if (circle) {
            objectList.push(circle);
        }

    }.bind(this);
}

function Hologram() {

    var hologramRect = null;
    var interferenceMaximum = -1;
    var numOfMaximums = 0;

    /**
     * Object initialization
     * @type {(function(this:Hologram))|Function}
     */
    this.init = function (canvas, id_) {

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

    /**
     * Adds hologram to given canvas
     * @param canvas
     */
    this.addToCanvas = function (canvas) {
        canvas.add(hologramRect);
    };

    /**
     * :O
     * @returns {*}
     */
    this.getHologramHeight = function () {
        return hologramRect.height;
    };

    /**
     * Computes interference pattern based on wavelength
     */
    this.computeInterference = function () {

        //x = lambda/sin(fi)
        interferenceMaximum = (wavelength * axisScale) / Math.sin(waveAngle * (Math.PI / 180));
        numOfMaximums = Math.floor(hologramRect.width / interferenceMaximum);

        var colors = {
            0: "white"
        };

        var colorStep = 1 / (numOfMaximums * 2);
        for (var n = 1; n < (numOfMaximums * 2); n++) {

            //odd or even
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
