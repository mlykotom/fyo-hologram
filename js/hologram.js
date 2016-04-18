/**
 * Rendering holographic scene - counting interference based on 2 monochromatic waves.
 * @author Roman Cizmarik
 * @author Tomas Mlynaric
 */
var Scene = {
    /** @type {fabric.Canvas} **/
    recordingCanvas: null,
    /** @type {fabric.Canvas} **/
    reconstructionCanvas: null,
    /** @type {Hologram} **/
    hologram: null,
    /** record tab **/
    record: {
        referenceWave: null,
        objectWave: null
    },
    /** reconstruction tab **/
    recon: {
        referenceWave: null,
        referenceWaveCont: null,
        objectWave: null
    },
    /** various options **/
    options: {
        windowBottomCompensation: 100,
        canvas_padding: 30,
        axisScale: 0.02,

        caption: {
            fontSize: 20,
            charPxHalf: 4
        },

        circle: {
            radius: 30,
            stroke: 2
        },

        wave: {
            stepWidth: 3,
            angle: 20,
            length: 520
        }
    },

    /**
     * Runs all magic
     */
    run: function () {
        this.recordingCanvas = this._initCanvas('recordingCanvas');
        this.reconstructionCanvas = this._initCanvas('reconstructionCanvas');
        // resizing window handler
        $(window).resize(function () {
            Scene.handlers.windowResize();
        }.bind(this));
        this.handlers.windowResize();

        // wavelength change handler
        $('#waveLengthInput').change(function () {
            Scene.handlers.wavelengthValueChanged(this.value);
        });
        // wave angle change handler
        $('#waveAngleInput').change(function () {
            Scene.handlers.angleValueChanged(this.value);
        });

        // initialize scene
        this.hologram = this._initHologram();
        this._initRecording();
        this._initReconstruction();
    },

    /**
     * Transforms wavelength to color
     * http://scienceprimer.com/javascript-code-convert-light-wavelength-color
     * @param wavelength
     * @returns {Array}
     */
    wavelengthToColor: function (wavelength) {

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
    },

    /**
     * Hologram object
     * @constructor
     */
    Hologram: function () {
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
            interferenceMaximum = (Scene.options.wave.length * Scene.options.axisScale) / Math.sin(Scene.options.wave.angle * (Math.PI / 180));
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
    },

    /**
     * Wave object
     * @param wavelength_
     * @param waveAngle_
     * @param canvas
     * @constructor
     */
    Wave: function (wavelength_, waveAngle_, canvas) {
        var __circle_radius_stroke = (Scene.options.circle.radius + Scene.options.circle.stroke);
        var objectList = [];
        var group = null;
        var waveWrapper = null;
        var width = 300;
        var height = __circle_radius_stroke * 2;

        this.wavelength = wavelength_ * Scene.options.axisScale;
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
                radius: Scene.options.circle.radius,
                fill: 'white',
                left: left,
                top: top_,
                strokeWidth: Scene.options.circle.stroke,
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
                height: height,
                fill: 'transparent'
            });

            this.caption = new fabric.Text(caption_, {
                left: waveWrapper.left + (waveWrapper.width / 2) - (caption_.length * Scene.options.caption.charPxHalf),
                top: waveWrapper.top + waveWrapper.height,
                fontSize: Scene.options.caption.fontSize,
                id: "caption",
                visible: false
            });

            objectList.push(this.caption);
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
         * Creates wave elements (a.k.a rectangles) with appropriate color
         * @type {(function(this:Wave))|Function}
         */
        this.fillWave = function () {
            var currentX = waveWrapper.left - Scene.options.wave.stepWidth;
            var waveRight = waveWrapper.left + waveWrapper.width;

            var listOfWaveLines = [];
            while (currentX < waveRight) {
                var waveLine = new fabric.Rect({
                    left: currentX,
                    top: waveWrapper.top,
                    fill: Scene.wavelengthToColor(this.wavelength / Scene.options.axisScale)[0],
                    width: Scene.options.wave.stepWidth,
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
            this.wavelength = newWavelength * Scene.options.axisScale;
            this.fillWave();
            // add it as last so that it is on top of waves
            if (circle) {
                objectList.push(circle);
            }
        }.bind(this);
    },


    /**
     * Initializes canvas with handlers
     * @param id
     * @returns {fabric.Canvas}
     * @private
     */
    _initCanvas: function (id) {
        var canvas = new fabric.Canvas(id);
        canvas.on('mouse:over', this.handlers.canvasMouseOverOut.bind(this, true));
        canvas.on('mouse:out', this.handlers.canvasMouseOverOut.bind(this, false));
        return canvas;
    },

    /**
     * Hologram for both recording and reconstruction
     * @returns {Hologram}
     * @private
     */
    _initHologram: function () {
        var hologram = new Scene.Hologram();
        hologram.init(this.recordingCanvas, "hologram");
        hologram.addToCanvas(this.recordingCanvas);
        hologram.addToCanvas(this.reconstructionCanvas);
        return hologram;
    },

    /**
     * Recording scene
     * @private
     */
    _initRecording: function () {
        /**
         * Reference wave
         ** @type {Wave}
         */
        this.record.referenceWave = new Scene.Wave(Scene.options.wave.length, Scene.options.wave.angle, this.recordingCanvas);
        this.record.referenceWave.init(this.recordingCanvas.width / 2, (this.recordingCanvas.height / 2), "recordReferenceWave", "Referenční vlna");

        /**
         * Object wave
         ** @type {Wave}
         */
        this.record.objectWave = new Scene.Wave(Scene.options.wave.length, 0, this.recordingCanvas);
        this.record.objectWave.init(this.recordingCanvas.width / 2, (this.recordingCanvas.height / 2), "recordObjectWave", "Objektová vlna", true);
    },

    /**
     * Reconstruction scene
     * @private
     */
    _initReconstruction: function () {
        //left for waves on the left half of canvas
        var left_ = this.reconstructionCanvas.width / 2 - (300 + this.hologram.getHologramHeight());
        //avoid values less then 0
        left_ = (left_ < 0) ? 0 : left_;

        /**
         * Reference wave
         * @type {Wave}
         */
        this.recon.referenceWave = new Scene.Wave(Scene.options.wave.length, Scene.options.wave.angle, this.reconstructionCanvas);
        this.recon.referenceWave.init(this.recordingCanvas.width / 2, (this.recordingCanvas.height / 2), "reconReferenceWave", "Referenční vlna");

        /**
         * Reference wave continuation
         * @type {Wave}
         */
        this.recon.referenceWaveCont = new Scene.Wave(Scene.options.wave.length, Scene.options.wave.angle + 180, this.reconstructionCanvas);
        this.recon.referenceWaveCont.init(left_ + 300, (this.reconstructionCanvas.height / 2), "reconReferenceWaveContinue", "Referenční vlna");
        this.recon.referenceWaveCont.caption.rotate(180);

        /**
         * Object wave
         * @type {Wave}
         */
        this.recon.objectWave = new Scene.Wave(Scene.options.wave.length, 0, this.reconstructionCanvas);
        this.recon.objectWave.init(left_, (this.reconstructionCanvas.height / 2), "reconObjectWave", "Objektová vlna", true);
    },

    /**
     * All event handlers
     */
    handlers: {
        /**
         * Callback function called when window is resizing
         */
        windowResize: function () {
            var wrapperWidth = $('#canvasWrapper').width() - Scene.options.canvas_padding;
            var windowHeight = $(window).height() - $('#header').height() - Scene.options.windowBottomCompensation;

            Scene.recordingCanvas.setWidth(wrapperWidth);
            Scene.recordingCanvas.setHeight(windowHeight);
            Scene.recordingCanvas.calcOffset();

            Scene.reconstructionCanvas.setWidth(wrapperWidth);
            Scene.reconstructionCanvas.setHeight(windowHeight);
            Scene.reconstructionCanvas.calcOffset();
        },

        /**
         * Callback function, called when mouse is over or out of object
         * @param isMouseOver
         * @param event
         */
        canvasMouseOverOut: function (isMouseOver, event) {
            var regexp = /.*Wave.*/;
            if (event.target.get("id").match(regexp)) {
                var wave = event.target;
                var textObjects = wave.getObjects('text');
                if (textObjects.length > 0) {
                    textObjects[0].visible = isMouseOver;

                }
            }
            event.target.canvas.renderAll();
        },

        /**
         * Callback function, called when wavelength is changed
         * @param newValue
         */
        wavelengthValueChanged: function (newValue) {
            $('#wavelengthValue').html(newValue);
            //change wavelength of all waves
            Scene.record.objectWave.changeWaveLength(newValue);
            Scene.record.referenceWave.changeWaveLength(newValue);
            // reconstruction
            Scene.recon.referenceWave.changeWaveLength(newValue);
            Scene.recon.referenceWaveCont.changeWaveLength(newValue);
            Scene.recon.objectWave.changeWaveLength(newValue);

            Scene.options.wave.length = newValue;
            Scene.hologram.computeInterference();

            Scene.reconstructionCanvas.renderAll();
            Scene.recordingCanvas.renderAll();
        },

        /**
         * Callback function, called when angle is changed
         * @param newAngle
         */
        angleValueChanged: function (newAngle) {
            $('#angleValue').html(newAngle);
            //change wavelength of all relevant waves - object wave not affected
            Scene.record.referenceWave.changeAngle(newAngle);

            // reconstruction
            Scene.recon.referenceWave.changeAngle(newAngle);
            Scene.recon.referenceWaveCont.changeAngle(newAngle - 180);

            Scene.options.wave.angle = newAngle;
            Scene.hologram.computeInterference();

            Scene.reconstructionCanvas.renderAll();
            Scene.recordingCanvas.renderAll();
        }
    }
};

Scene.run();