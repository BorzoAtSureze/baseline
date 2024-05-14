Highcharts.wrap(Highcharts.Pointer.prototype, 'pinch', function (proceed, e) {
    if (e.touches.length === 1 && e.type === 'touchmove') {
        this.chart.pan(e, this.chart.options.panning);
    }
    else {
        proceed.call(this, e);
        if (e.type === 'touchstart') {
            this.chart.mouseDownX = this.pinchDown[0].chartX;
            this.chart.mouseDownY = this.pinchDown[0].chartY;
        }
    }
});
var StripStatusEnum;
(function (StripStatusEnum) {
    StripStatusEnum[StripStatusEnum["All"] = -1] = "All";
    StripStatusEnum[StripStatusEnum["SelectAnOption"] = 0] = "SelectAnOption";
    StripStatusEnum[StripStatusEnum["Live"] = 1] = "Live";
    StripStatusEnum[StripStatusEnum["Ready"] = 2] = "Ready";
    StripStatusEnum[StripStatusEnum["Archived"] = 3] = "Archived";
    StripStatusEnum[StripStatusEnum["Archiving"] = 4] = "Archiving";
})(StripStatusEnum || (StripStatusEnum = {}));
var NotesTypeEnum;
(function (NotesTypeEnum) {
    NotesTypeEnum[NotesTypeEnum["All"] = -1] = "All";
    NotesTypeEnum[NotesTypeEnum["SelectAnOption"] = 0] = "SelectAnOption";
    NotesTypeEnum[NotesTypeEnum["CTG"] = 1] = "CTG";
    NotesTypeEnum[NotesTypeEnum["Clinical"] = 2] = "Clinical";
})(NotesTypeEnum || (NotesTypeEnum = {}));
var charts = {};
var chartResizeTimers = {};
var ctgChartPageBase_dotNetObjRef;
class CTGChart {
    navigateTo(datetime) {
        //navigate scroll top to chart
        var chartTop = $('#' + this.chartElementId)[0].clientTop;
        $(window).scrollTop(chartTop);
        if (typeof datetime == "string")
            datetime = datetime.toDate();
        if (typeof datetime == "number")
            datetime = datetime.toDate();
        datetime = datetime.getTime();
        if (this.maxX - this.minX <= this.options.range * 60 * 1000) {
            return;
        }
        var time = datetime - (this.options.range * 60 * 1000) / 2;
        if (this.minX >= time)
            time = this.minX;
        else if (this.maxX <= datetime + (this.options.range * 60 * 1000) / 2)
            time = this.maxX - this.options.range * 60 * 1000;
        this.stockChart.xAxis[0].setExtremes(time, time + this.options.range * 60 * 1000, true, false);
        // blinking
        var point = this.note_series.points.find(k => k.x == datetime);
        // console.log(point);
        var PlotLine = this.stockChart.xAxis[0].getPlotLinePath({ value: datetime });
        // console.log('PlotLine', PlotLine)
        var times = 5;
        var durationBetweenBlinks = 100;
        function toPurple() {
            point.graphic.animate({
                fill: 'purple'
            }, {
                duration: durationBetweenBlinks,
                easing: 'ease-in'
            }, toWhite);
        }
        function toWhite() {
            if (times <= 0)
                return;
            times--;
            point.graphic.animate({
                fill: 'white'
            }, {
                duration: durationBetweenBlinks
            }, toPurple);
        }
        toPurple();
    }
    showBradycardia_OR_Tachycardia(tachyOrBradyMessage) {
        $(`#flashing-message_${this.chartElementId}`).remove();
        if (this.options.isLive && tachyOrBradyMessage) {
            this.flashing(tachyOrBradyMessage, this.fhrTop, this.fhrHeight);
        }
    }
    flashing(tachyOrBradyMessage, top, height) {
        $('#' + this.chartElementId).css({ position: 'relative' });
        var fontsize = ($('#' + this.chartElementId).height() / 17) + 5;
        $(`<div id="flashing-message_${this.chartElementId}" style="position:absolute;inset:0;top:${top}px;height:${height}px;background-color:transparent;display: flex;justify-content: center;align-items:end" />`)
            .append(`<h4 class="flash" style="font-size:${fontsize}pt;color: #f72885;margin: 0;margin-bottom: 1%;">${tachyOrBradyMessage}</h4>`)
            .appendTo('#' + this.chartElementId);
    }
    get stripId() { return this.options.stripId; }
    get laborId() { return this.options.laborId; }
    get chartElementId() { return `chart_${this.options.stripId}`; }
    constructor(options) {
        this.aiClassifiedBands = [];
        this.$xAxisLabels = [];
        this.lastBaseline = null;
        this.celerationCounter = 0;
        this.isPreviousWas__Celeration = false;
        this.accelerationPack = [];
        this.decelerationPack = [];
        this.minuteData = [];
        this.goToEndOfChart = true;
        /** in seconds */
        this.goToEndDuration = 30;
        this.$ctgchartpane = $('<div class="ctg-chart-pane" />');
        this.menus = {
            fullScreen: {
                onclick: () => SwitchToFullScreen(true),
                text: 'Full Screen'
            },
        };
        options.range = options.range || 35;
        this.options = options;
        this.registerSignalRTaskEvents();
        this.createChart();
    }
    registerSignalRTaskEvents() {
        if (this.options.printTaskId)
            RegisterInTaskEvent(this.options.printTaskId, {
                TaskCanceled: async (_taskId) => {
                    //this will pause the creating pages on print.cshtml
                    if (_taskId == this.options.printTaskId) {
                        this.printCanceled = true;
                    }
                }
            });
    }
    createChart() {
        console.time("chart.createChart()");
        this.setChartResizeObserver();
        this.generateChart();
        console.timeEnd("chart.createChart()");
    }
    setChartResizeObserver() {
        this.width = $('#' + this.chartElementId).width();
        var resizeTimer = chartResizeTimers[this.stripId] = { wait: 2000, timer: undefined };
        const resizeObserver = new ResizeObserver((entries) => {
            resizeTimer.wait = 1000;
            clearInterval(resizeTimer.timer);
            resizeTimer.timer = setInterval(() => {
                resizeTimer.wait -= 500;
                doResize(entries);
            }, 500);
        });
        resizeObserver.observe(document.querySelector("#" + this.chartElementId));
        let doResize = (entries) => {
            if (resizeTimer.wait > 0)
                return;
            var chartElementNewWidth = $(entries[0].target).width();
            if (chartElementNewWidth > 0 && chartElementNewWidth != this.width && Math.abs(chartElementNewWidth - this.width) > 100) {
                this.width = chartElementNewWidth;
                // resize(this.stripId);
            }
            clearInterval(resizeTimer.timer);
        };
    }
    addPoints(data, showDataInLabels = true) {
        if (data && data.length == 0)
            return;
        if (!this.minTime)
            this.minTime = data[0].createdDt;
        var firstSecond = this.minTime;
        const addPointToSeries = (point, isFake) => {
            var oldCreatedDt = point.createdDt;
            this.options.data[point.createdDt] = point;
            if (point.note) {
                //this.addNote(point.note);
            }
            this.series_fhr1.addPoint({ x: point.createdDt, y: point.fhR1 }, false);
            this.series_fhr2.addPoint([point.createdDt, point.fhR2], false);
            this.series_toco.addPoint([point.createdDt, point.toco], false);
            this.series_original_fhr1.addPoint([point.createdDt, point.original_fhR1], false);
            this.series_fhr1_baseline.addPoint({ x: point.createdDt, y: point.baseline }, false);
            this.series_fhr1_acceleration.addPoint([point.createdDt, null, null], false);
            this.series_fhr1_deceleration.addPoint([point.createdDt, null, null], false);
            if (point.acceleration || point.deceleration) {
                this.celerationCounter++;
                var time = point.createdDt;
                if (!this.isPreviousWas__Celeration) {
                }
                if (point.acceleration) {
                    this.accelerationPack.push([time, point.baseline, point.fhR1]);
                }
                if (point.deceleration) {
                    this.decelerationPack.push([time, point.baseline, point.fhR1]);
                }
                this.isPreviousWas__Celeration = true;
            }
            else {
                this.isPreviousWas__Celeration = false;
                if (this.celerationCounter > 15) {
                    this.accelerationPack.forEach(ac => this.series_fhr1_acceleration.addPoint(ac, false));
                    this.decelerationPack.forEach(de => this.series_fhr1_deceleration.addPoint(de, false));
                }
                this.accelerationPack = [];
                this.decelerationPack = [];
                this.celerationCounter = 0;
            }
            /// calculate baseline
            const createBaseline = (windowSize, series_fhr1_baseline) => {
                const countOfNumbers = windowSize * 60;
                const windowSizeMilli = windowSize * 60 * 1000;
                var last_baseline = this.lastBaseline;
                if (this.lastBaseline) {
                    if (point.createdDt - this.lastBaseline.time > windowSizeMilli / 2) {
                        //there is a gap => create a null value in next and prev seconds to split line
                        series_fhr1_baseline.addPoint({ x: this.lastBaseline.time + 1000, y: null }, false);
                        series_fhr1_baseline.addPoint({ x: point.createdDt - 1000, y: null }, false);
                        firstSecond = point.createdDt;
                        this.lastBaseline = null;
                    }
                    else {
                        var prevAvg = last_baseline.avg;
                        var newAvg = prevAvg + (point.fhR1 - prevAvg) / countOfNumbers;
                        var newAvg2 = last_baseline.avg2 + (point.fhR1 - last_baseline.avg2) / countOfNumbers;
                        // use prevAvg if it is inclueded in acceleration or deceleration
                        if (last_baseline.acceleration || last_baseline.deceleration) {
                            newAvg2 = last_baseline.avg2;
                        }
                        last_baseline = { time: point.createdDt, avg: newAvg, avg2: newAvg2, fhrPoint: point, acceleration: point.fhR1 - newAvg > 15, deceleration: newAvg - point.fhR1 > 15 };
                        series_fhr1_baseline.addPoint({ x: last_baseline.time, y: last_baseline.avg }, false);
                        this.lastBaseline = last_baseline;
                        this.series_fhr1_acceleration.addPoint([point.createdDt, null, null], false);
                        this.series_fhr1_deceleration.addPoint([point.createdDt, null, null], false);
                        if (Math.abs(point.fhR1 - newAvg) > 15) {
                            this.celerationCounter++;
                            var time = point.createdDt;
                            if (!this.isPreviousWas__Celeration) {
                            }
                            if (point.fhR1 > newAvg) {
                                this.accelerationPack.push([time, newAvg, point.fhR1]);
                            }
                            else {
                                this.decelerationPack.push([time, point.fhR1, newAvg]);
                            }
                            this.isPreviousWas__Celeration = true;
                        }
                        else {
                            this.isPreviousWas__Celeration = false;
                            if (this.celerationCounter > 15) {
                                this.accelerationPack.forEach(ac => this.series_fhr1_acceleration.addPoint(ac, false));
                                this.decelerationPack.forEach(de => this.series_fhr1_deceleration.addPoint(de, false));
                            }
                            this.accelerationPack = [];
                            this.decelerationPack = [];
                            this.celerationCounter = 0;
                        }
                        /// variablity baseline
                        const createBaselineVariability = () => {
                            if (this.minuteData.length && (point.createdDt - this.minuteData[0].point.createdDt) < 60 * 1000) {
                                // we are in the middle of the minute
                            }
                            else {
                                // we are in the beginning of the minute
                                var min = Math.min(...this.minuteData.map(k => k.baseline));
                                var max = Math.max(...this.minuteData.map(k => k.baseline));
                                /*
                                    Normal variability 6-25 beats per minute
                                    Reduced variability 3-5 beats per minute
                                    Absent variability <3 beats per minute
                                    Increased (salutatory) variability > 25 beats per minute
                                **/
                                var variablility = max - min;
                                if (variablility > 25) {
                                    // Increased
                                }
                                else if (6 <= variablility && variablility <= 25) {
                                    //normal
                                }
                                else if (3 <= variablility && variablility <= 5) {
                                    //normal
                                }
                                else if (3 > variablility) {
                                    //normal
                                }
                                console.log("minuteData", min, max, this.minuteData);
                                this.minuteData = [];
                            }
                            this.minuteData.push({ point, baseline: newAvg });
                        };
                        //createBaselineVariability();
                    }
                }
                else {
                    //find the start point (the first point after 10 minutes)
                    if (firstSecond + windowSizeMilli < point.createdDt) {
                        if (point.createdDt - this.prevPoint.createdDt >= windowSizeMilli / 2) {
                            //there is a gap => change the firstSecond
                            firstSecond = point.createdDt;
                            series_fhr1_baseline.addPoint({ x: this.prevPoint.createdDt + 1000, y: null }, false);
                            series_fhr1_baseline.addPoint({ x: point.createdDt - 1000, y: null }, false);
                        }
                        else {
                            // first point found!
                            var inx = data.findIndex(k => k.createdDt == point.createdDt);
                            var _10minsData = data.slice(0, inx);
                            var avg = average(_10minsData, k => k.fhR1);
                            last_baseline = { time: point.createdDt, avg: avg, avg2: avg, fhrPoint: point, acceleration: point.fhR1 - avg > 15, deceleration: avg - point.fhR1 > 15 };
                            series_fhr1_baseline.addPoint({ x: last_baseline.time, y: last_baseline.avg }, false);
                            this.lastBaseline = last_baseline;
                        }
                    }
                }
            };
            try {
                if (!isFake) {
                    //createBaseline(10, this.series_fhr1_baseline);
                    //createBaseline(5,this.series_fhr1_baseline_5min, this.series_fhr1_baseline_5min2);
                }
            }
            catch (eee) {
                console.log(eee);
            }
        };
        //console.time("addPoints");
        //this.prevPoint: IStripDataPoint;
        data.forEach((point, i) => {
            this.resolvePoint(point, this.prevPoint);
            if (point && this.prevPoint) {
                var p = {
                    createdDtAsDate: new Date(this.prevPoint.createdDt),
                    createdDt: this.prevPoint.createdDt,
                    fhR1: null, fhR2: null, toco: null,
                    original_fhR1: null, original_fhR2: null, original_toco: null,
                    resolved: true, note: null,
                    baseline: null
                };
                while (p.createdDt + 2000 < point.createdDt) {
                    // add gap if diffrence is more than a second
                    p.createdDt += 1000;
                    p.createdDtAsDate = p.createdDt.toDate();
                    addPointToSeries({ ...p }, true);
                }
            }
            ;
            addPointToSeries(point, false);
            this.prevPoint = point;
        });
        if (this.options.showLatestValuesLabel) {
            let fhr1_label_value = 0, fhr2_label_value = 0, toco_label_value = 0;
            if (data.length && showDataInLabels) {
                var v = data[data.length - 1];
                fhr1_label_value = ~~v.fhR1;
                fhr2_label_value = ~~v.fhR2;
                toco_label_value = ~~v.toco;
            }
            this.setLabelValues(fhr1_label_value, fhr2_label_value, toco_label_value);
            this.reset_ClearLabelsTimer();
        }
        //console.timeEnd("addPoints");
    }
    resolvePoint(point, prevPoint) {
        if (point.resolved)
            return;
        point.original_fhR1 = point.fhR1;
        point.original_fhR2 = point.fhR2;
        point.original_toco = point.toco;
        if (point.fhR1 < 50 || point.fhR1 > 210) {
            point.original_fhR1 = point.fhR1;
            point.fhR1 = null;
        }
        if (point.fhR2 < 50 || point.fhR2 > 210) {
            point.original_fhR2 = point.fhR2;
            point.fhR2 = null;
        }
        if (point.toco < 0 || point.toco > 100) {
            point.original_toco = point.toco;
            point.toco = null;
        }
        if (prevPoint) {
            //fhr1
            if (prevPoint.fhR1 && point.fhR1 && Math.abs(prevPoint.fhR1 - point.fhR1) > 15) {
                point.original_fhR1 = point.fhR1;
                point.fhR1 = null;
            }
            //fhr2
            if (prevPoint.fhR2 && point.fhR2 && Math.abs(prevPoint.fhR2 - point.fhR2) > 15) {
                point.original_fhR2 = point.fhR2;
                point.fhR2 = null;
            }
        }
        point.resolved = true;
    }
    setLabelValues(fhr1_label_value, fhr2_label_value, toco_label_value) {
        //fhr1_label_value += 50
        //fhr2_label_value += 50
        //toco_label_value += 50
        const calcX = (label) => {
            var minX = this.stockChart.plotWidth - 25;
            if (this.stockChart.plotWidth > 400) {
                minX = this.stockChart.plotWidth - 30;
            }
            if (this.stockChart.plotWidth > 600) {
                minX = this.stockChart.plotWidth - 40;
            }
            var w = label.attr("width");
            var fhr1W = this.fhr1_label.attr("width");
            var fhr2W = this.fhr2_label.attr("width");
            var tocoW = this.toco_label.attr("width");
            var maxW = Math.max(fhr1W, fhr2W, tocoW);
            var addX = (maxW - w) / 2;
            addX = addX > 0 ? addX + 1 : addX;
            var newX = minX + addX;
            label.attr({ translateX: newX });
            return label.attr("translateX");
        };
        this.fhr1_label.attr({
            text: fhr1_label_value || "--",
        });
        this.fhr2_label.attr({
            text: fhr2_label_value || "--",
        });
        this.toco_label.attr({
            text: toco_label_value || "--",
        });
        this.fhr1_label.attr({
            translateX: calcX(this.fhr1_label)
        });
        this.fhr2_label.attr({
            translateX: calcX(this.fhr2_label)
        });
        this.toco_label.attr({
            translateX: calcX(this.toco_label)
        });
    }
    reset_ClearLabelsTimer() {
        clearTimeout(this.clearLabelsTimer);
        this.clearLabelsTimer = setTimeout(() => {
            this.setLabelValues(0, 0, 0);
        }, 7000);
    }
    generateChart() {
        var { options, label_font_size, fhrtop, tocotop, fhrheight, width, height } = this.createOptions();
        this.fhrTop = fhrtop;
        this.fhrHeight = fhrheight;
        var fhr1Y = 10;
        var fhr2Y = 40;
        var tocoY = 10;
        if (width < 1000) {
            var fhr1Y = 10;
            var fhr2Y = 40;
        }
        if (width < 800) {
            var fhr1Y = 0;
            var fhr2Y = 15;
        }
        if (width < 600) {
            var fhr1Y = 0;
            var fhr2Y = 10;
            var tocoY = 0;
        }
        if (width < 400) {
            var fhr1Y = -5;
            var fhr2Y = 5;
        }
        if (width < 300) {
            var fhr1Y = -5;
            var fhr2Y = -10;
        }
        fhr1Y += fhrtop;
        fhr2Y += fhrtop;
        tocoY += tocotop;
        console.time("Highcharts.stockChart");
        $('#' + this.chartElementId).empty();
        this.stockChart = Highcharts.stockChart(this.chartElementId, options, (_chart) => {
            if (this.options.showLatestValuesLabel) {
                this.fhr1_label = _chart.renderer.label('', _chart.plotWidth - 30, fhr1Y)
                    .css({
                    color: 'black',
                    fontSize: label_font_size,
                    width: 70,
                    textAlign: 'center'
                })
                    .attr({
                    r: 5,
                    zIndex: 6,
                })
                    .add();
                this.fhr2_label = _chart.renderer.label('', _chart.plotWidth - 30, fhr2Y)
                    .css({
                    color: 'red',
                    fontSize: label_font_size,
                    width: 70,
                    textAlign: 'center'
                })
                    .attr({
                    r: 5,
                    zIndex: 6
                })
                    .add();
                this.toco_label = _chart.renderer.label('', _chart.plotWidth - 30, tocoY)
                    .css({
                    color: 'black',
                    fontSize: label_font_size,
                    width: 70,
                    textAlign: 'center'
                })
                    .attr({
                    r: 5,
                    zIndex: 6
                })
                    .add();
            }
        });
        console.timeEnd("Highcharts.stockChart");
        if (this.options.data && this.dataLength) {
            if (this.dataLength < this.options.range * 60) {
                var first = this.data[0];
                var lastSecond = first.createdDt + this.options.range * 60 * 1000;
                this.options.data[lastSecond] = { createdDt: lastSecond, fhR1: null, fhR2: null, toco: null, baseline: null };
            }
            this.addPoints(this.data, false);
        }
        else
            this.addPoints([{ createdDtAsDate: new Date(), createdDt: new Date().getDate(), fhR1: 0, fhR2: 0, toco: 0, baseline: 0, note: null }], false);
        this.configureExtremes();
        if (this.note_series.data == null || this.note_series.data.length <= 0) {
            this.stockChart.series[0].update({ showInNavigator: false }, true);
        }
        this.configureNavigator();
        // this.showDisconnectMessage();
        // this.showStatusMessage();
        //this.createBaseline();
    }
    getSeries(id) {
        return this.stockChart.series.find(k => k.options.id == id);
    }
    get data() {
        const resetData = () => {
            this._data = Object.getOwnPropertyNames(this.options.data).sort().map(k => this.options.data[k]);
        };
        resetData();
        return this._data;
    }
    get dataLength() {
        return Object.getOwnPropertyNames(this.options.data).length;
    }
    get maxX() { return this.data[this.dataLength - 1]?.createdDt; }
    get minX() { return this.data[0]?.createdDt; }
    configureNavigator() {
        var showNavigator = Math.abs(this.maxX - this.minX) > this.options.range * 60 * 1000;
        this.stockChart.update({
            navigator: {
                height: showNavigator && this.options.showNavigator ? 58 : 0,
                outlineWidth: showNavigator && this.options.showNavigator ? 1 : 0,
            }, scrollbar: {
                enabled: showNavigator && this.options.showNavigator
            }
        });
    }
    configureExtremes() {
        if (Math.abs(this.maxX - this.minX) < this.options.range * 60 * 1000) {
            this.stockChart.xAxis[0].setExtremes(this.minX, this.minX + this.options.range * 60 * 1000, true, false);
        }
        else {
            if (this.goToEndOfChart)
                this.stockChart.xAxis[0].setExtremes(this.maxX - this.options.range * 60 * 1000, this.maxX, true, false);
        }
    }
    createOptions() {
        const createChartPane = () => {
            this.$ctgchartpane.remove();
            this.$ctgchartpane = $('<div class="ctg-chart-pane" />').insertBefore('#' + this.chartElementId);
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var $pane_header = $('<div class="ctg-chart-pane-header" />').height(top_title_height).css({ top: 0 });
            var $patientInfo = $('<div class="ctg-chart-pane-header-patient-info" />')
                .html(`${this.options.patient.roomName} &nbsp;&nbsp; Name: ${this.options.patient.patientName.ellipsis(20)}  &nbsp;&nbsp;    MRN: ${this.options.patient.mrnNo}    &nbsp;&nbsp;    Age: ${this.options.patient.age}  &nbsp;&nbsp; POA: ${this.options.patient.poa} &nbsp;&nbsp; Admitted Duration: ${this.options.patient.admittedHours}  `).appendTo($pane_header);
            if (this.options.showExportMenu) {
            }
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var $pane_fhr = $('<div class="ctg-chart-pane-fhr" />').height(fhrheight).css({ top: fhrtop });
            var $pane_datetime = $('<div class="ctg-chart-pane-datetime" />').height(fhr_toco_space_height).css({ top: fhr_toco_space_top });
            var $pane_toco = $('<div class="ctg-chart-pane-toco" />').height(tocoheight).css({ top: tocotop });
            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            /// Y lines
            var $pane_fhr_y = $('<div class="ctg-chart-pane-fhr-y" />').appendTo($pane_fhr);
            var fhr_Y_lines_count = 17;
            for (var i = 0; i < fhr_Y_lines_count; i++) {
                $('<div class="ctg-chart-pane-fhr-y-line" />').appendTo($pane_fhr_y);
            }
            // X lines
            var $pane_fhr_x = $('<div class="ctg-chart-pane-fhr-x" />').appendTo($pane_fhr);
            var fhr_X_lines_count = this.options.range + 1;
            for (var i = 0; i < fhr_X_lines_count; i++) {
                var $x_line = $('<div class="ctg-chart-pane-fhr-x-line" />').appendTo($pane_fhr_x);
                if ((i) % 10 == 0)
                    [...Array((fhr_Y_lines_count - 1) / 2).keys()].map(j => {
                        var lineValue = $('<span />').text(fhrEnd - 10 - j * 2 * 10);
                        $x_line.append(lineValue);
                    });
            }
            ////////////  x labels  ///////////////////////////////
            var j = 0;
            for (var i = 0; i < fhr_X_lines_count; i++) {
                var $datetimeValue = $('<div class="ctg-chart-pane-datetime-value" />').appendTo($pane_datetime);
                if ((i) % 10 == 0) {
                    this.$xAxisLabels[j] = $datetimeValue;
                    j++;
                }
            }
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            var $pane_toco_y = $('<div class="ctg-chart-pane-toco-y" />').appendTo($pane_toco);
            var toco_Y_lines_count = 6;
            for (var i = 0; i < toco_Y_lines_count; i++) {
                $('<div class="ctg-chart-pane-toco-y-line" />').appendTo($pane_toco_y);
            }
            var $pane_toco_x = $('<div class="ctg-chart-pane-toco-x" />').appendTo($pane_toco);
            var toco_X_lines_count = this.options.range + 1;
            for (var i = 0; i < toco_X_lines_count; i++) {
                var $x_line = $('<div class="ctg-chart-pane-toco-x-line" />').appendTo($pane_toco_x);
                if ((i) % 10 == 0)
                    [...Array(toco_Y_lines_count).keys()].map(j => {
                        var lineValue = $('<span />').text(tocoEnd - j * 2 * 10);
                        $x_line.append(lineValue);
                    });
            }
            /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            $pane_toco.css({
                '--ctg-y-color': linecolor,
                '--ctg-y-color-even': linecolor,
                '--ctg-y-width': '1pt'
            });
            this.$ctgchartpane.empty().append($pane_header, $pane_fhr, $pane_datetime, $pane_toco)
                .css({
                '--ctg-y-color': minorlinecolor,
                '--ctg-y-color-even': linecolor,
                '--ctg-x-color': minorlinecolor,
                '--ctg-x-color-10th': linecolor,
                '--ctg-chart-font-size': fontSize + 'px',
                '--ctg-toco-x-line-margin': -unit_px / 3 + 'px'
            });
        };
        var fhrBradyHigh = 0;
        var fhrBradyLow = 0;
        var fhrTachyHigh = 0;
        var fhrTachyLow = 0;
        var width = $('#' + this.chartElementId).width();
        var unit_px = width / this.options.range;
        var top_title_height = 30;
        var fhrtop = top_title_height;
        var fhrheight = 8 * unit_px;
        var fhr_toco_space_top = fhrtop + fhrheight;
        var fhr_toco_space_height = 1 * unit_px;
        var tocotop = fhrtop + fhrheight + fhr_toco_space_height;
        var tocoheight = 5 * unit_px;
        var toco_navigator_space = 1 * unit_px; // space between toco and navigator
        var navigator_height = this.options.showNavigator ? 58 : 0;
        var fontSize = 16;
        var seriesLineWidth = 1;
        if (width < 1100) {
            fontSize = 13;
        }
        if (width < 900) {
            fontSize = 11;
            seriesLineWidth = .7;
        }
        if (width < 650) {
            fontSize = 9;
            seriesLineWidth = .7;
        }
        if (width < 500) {
            fontSize = 8;
            seriesLineWidth = .5;
        }
        if (width < 400) {
            fontSize = 7;
        }
        if (width < 300) {
            fontSize = 5;
        }
        var height = top_title_height + fhrheight + fhr_toco_space_height + tocoheight + toco_navigator_space + navigator_height;
        $('#' + this.chartElementId).css('height', height);
        var linecolordark = '#ff6500';
        var linecolor = '#ff8c40';
        var minorlinecolor = '#ffc7a2';
        var linecolor2 = '#8cff40';
        var minorlinecolor2 = '#c7ffa2';
        var linecolor3 = '#8c40ff';
        var minorlinecolor3 = '#c7a2ff';
        var fhr1_label_top = height;
        var fhr2_label_top = height;
        var toco_label_top = (height * (82 / 100)) + 30;
        var first = 25;
        var second = width * 28.58 / 100;
        var third = width * 57.15 / 100;
        var last = width * 85.72 / 100;
        var label_font_size = fontSize + 2 + "px";
        var fhrStart = 50, fhrEnd = 210, tocoStart = 0, tocoEnd = 100;
        let _this = this;
        var options = {
            chart: {
                animation: false,
                backgroundColor: 'transparent',
                events: {
                    load: function () {
                        const getSeries = (id) => {
                            return this.series.find(k => k.options.id == id);
                        };
                        console.time("chart.events.load");
                        //TODO
                        _this.note_series = getSeries('Notes');
                        _this.series_fhr1 = getSeries('fhr1');
                        _this.series_fhr2 = getSeries('fhr2');
                        _this.series_toco = getSeries('toco');
                        _this.series_original_fhr1 = getSeries('original_fhr1');
                        _this.series_fhr1_baseline = getSeries('fhr1baseLine');
                        _this.series_fhr1_acceleration = getSeries('acceleration');
                        _this.series_fhr1_deceleration = getSeries('deceleration');
                        console.timeEnd("chart.events.load");
                    },
                    click: (e) => {
                    }
                },
                spacingRight: 0,
                spacingLeft: 0,
                spacingBottom: 0,
                spacingTop: 0,
                zooming: {
                    mouseWheel: false,
                },
                panning: {
                    enabled: true,
                    type: 'x'
                },
            },
            credits: { enabled: false },
            navigator: {
                //enabled: chart.customChartOptions.showNavigator,
                height: navigator_height,
                outlineWidth: this.options.showNavigator ? 1 : 0,
                handles: {
                    enabled: false
                },
                xAxis: {
                    labels: {
                        enabled: this.options.showNavigator,
                        style: {
                            fontSize: fontSize + 'px'
                        },
                    }
                }
            },
            scrollbar: {
                enabled: this.options.showNavigator
            },
            title: {},
            subtitle: {
                style: { fontSize: fontSize + 'px', textAlign: 'center' },
                y: 15,
                align: 'center'
            },
            legend: {
                enabled: false
            },
            plotOptions: {
                series: {
                    animation: false,
                    showInNavigator: this.options.isLive || this.options.showNavigator,
                    clip: true,
                    crisp: false,
                    tooltip: {},
                    //dataGrouping: {
                    //    units: [[
                    //        'second',
                    //        [1, 4]
                    //    ], [
                    //        'minute',
                    //        [1]
                    //    ], [
                    //        'hour',
                    //        [1]
                    //    ], [
                    //        'day',
                    //        [1]
                    //    ], [
                    //        'week',
                    //        [1]
                    //    ], [
                    //        'month',
                    //        [1]
                    //    ], [
                    //        'year',
                    //        null
                    //    ]]
                    //},
                },
                line: {
                    color: {
                        linearGradient: {
                            x1: 0,
                            y1: 0,
                            x2: 0,
                            y2: 0
                        },
                        stops: [
                        //[0, Highcharts.getOptions().colors[0] as Highcharts.GradientColorObject],
                        //[1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                        ]
                    },
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    stickyTracking: false,
                    enableMouseTracking: false,
                    lineWidth: seriesLineWidth
                }
            },
            rangeSelector: {
                enabled: false,
                floating: true,
                y: this.options.range,
                inputDateFormat: '%d/%m/%Y %I:%M %P',
                buttons: [],
                selected: 1,
                //inputEnabled: false
            },
            exporting: {
                enabled: false,
            },
            series: [
                {
                    animation: false,
                    type: 'scatter',
                    name: 'Notes',
                    id: 'Notes',
                    keys: ['x', 'y', 'notes', 'sequence'],
                    dataLabels: { format: "{point.sequence}", enabled: true, y: 10 },
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    marker: {
                        symbol: 'circle',
                        fillColor: 'purple',
                        radius: 10,
                    },
                    tooltip: {
                        //pointFormat: '<span style="{point.color}">●</span>  ID: {point.notes}',
                        pointFormat: '{point.notes}',
                        //pointFormatter: () => {
                        //    return ""
                        //}
                    },
                    stickyTracking: false,
                    events: {
                        click: (e) => {
                        },
                        mouseOver: (e) => {
                        }
                    }
                },
                {
                    id: 'fhr1',
                    type: 'line',
                    name: 'FHR1',
                    // data: series0,
                    color: 'black',
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    tooltip: {
                        valueDecimals: 2,
                    },
                    zIndex: 1,
                    pointStart: -1,
                },
                {
                    id: 'fhr2',
                    type: 'line',
                    name: 'FHR2',
                    color: 'red',
                    tooltip: {
                        valueDecimals: 2
                    },
                    //data: series1,
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                },
                {
                    id: 'toco',
                    type: 'line',
                    name: 'TOCO',
                    color: 'black',
                    //data: series2,
                    yAxis: 'y_toco',
                    xAxis: 'toco_datetime',
                    tooltip: {
                        valueDecimals: 2,
                        //pointFormat: '' //'<span style="color:{point.color}">●</span> {series.name}: <b>{point.y}</b>.'
                    }
                },
                {
                    id: 'original_fhr1',
                    type: 'line',
                    name: 'original_FHR1',
                    // data: series0,
                    color: 'gray',
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    tooltip: {
                        valueDecimals: 2,
                    },
                    zIndex: 0,
                },
                {
                    id: 'fhr1baseLine',
                    type: 'line',
                    name: 'fhr1baseLine',
                    // data: series0,
                    color: 'blue',
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    tooltip: {
                        valueDecimals: 2,
                    },
                    zIndex: 1,
                    pointStart: -1,
                },
                {
                    id: 'acceleration',
                    type: 'arearange',
                    name: 'acceleration',
                    // data: series0,
                    color: '#00f5',
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    tooltip: {
                        valueDecimals: 2,
                    },
                    zIndex: 1,
                    pointStart: -1,
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    stickyTracking: false,
                    enableMouseTracking: false,
                    connectNulls: false,
                },
                {
                    id: 'deceleration',
                    type: 'arearange',
                    name: 'deceleration',
                    // data: series0,
                    color: '#ffa71c50',
                    xAxis: 'fhr_datetime',
                    yAxis: 'y_fhr',
                    tooltip: {
                        valueDecimals: 2,
                    },
                    zIndex: 1,
                    pointStart: -1,
                    states: {
                        hover: {
                            enabled: false
                        }
                    },
                    stickyTracking: false,
                    enableMouseTracking: false,
                },
                // {
                //     id: 'fhr1baseLine2',
                //     type: 'line',
                //     name: 'fhr1baseLine2',
                //     // data: series0,
                //     color: '#f08',
                //     xAxis: 'fhr_datetime',
                //     yAxis: 'y_fhr',
                //     tooltip: {
                //         valueDecimals: 2,
                //     },
                //     zIndex: 1,
                //     pointStart: -1,
                // },
                // {
                //     id: 'fhr1baseLine_5min',
                //     type: 'line',
                //     name: 'fhr1baseLine_5min',
                //     // data: series0,
                //     color: '#08f',
                //     xAxis: 'fhr_datetime',
                //     yAxis: 'y_fhr',
                //     tooltip: {
                //         valueDecimals: 2,
                //     },
                //     zIndex: 1,
                //     pointStart: -1,
                // },
                // {
                //     id: 'fhr1baseLine_5min2',
                //     type: 'line',
                //     name: 'fhr1baseLine_5min2',
                //     // data: series0,
                //     color: 'transparent',//  '#80f',
                //     xAxis: 'fhr_datetime',
                //     yAxis: 'y_fhr',
                //     tooltip: {
                //         valueDecimals: 2,
                //     },
                //     zIndex: 1,
                //     pointStart: -1,
                // },
                //{
                //    type: 'sma',
                //    name: 'MA-FHR1',
                //    linkedTo: 'fhr1',
                //    params: {
                //        period: 10 * 60
                //    },
                //    color: 'purple',
                //    states: {
                //        hover: {
                //            enabled: false
                //        }
                //    },
                //    stickyTracking: false,
                //    enableMouseTracking: false,
                //    lineWidth: seriesLineWidth
                //},
                //{
                //    type: 'sma',
                //    name: 'MA-FHR2',
                //    linkedTo: 'fhr2',
                //    params: {
                //        period: 10 * 60
                //    },
                //    color: 'green'
                //},
                //{
                //    type: 'sma',
                //    name: 'MA-TOCO',
                //    linkedTo: 'toco',
                //    xAxis: 1,
                //    yAxis: 4,
                //    params: {
                //        period: 10 * 60
                //    },
                //    color: '#808055'
                //}
            ],
            xAxis: [
                //fhr
                {
                    id: 'fhr_datetime',
                    type: 'datetime',
                    tickInterval: 10 * (1 * 60) * 1000,
                    minorTickInterval: 1 * (1 * 60) * 1000,
                    gridLineColor: linecolor,
                    minorGridLineColor: minorlinecolor,
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    labels: {
                        enabled: false,
                        format: '&#129045; {value:%d/%m/%Y %I:%M %P}',
                        step: 1,
                        style: { fontSize: fontSize + 'px' },
                        align: 'left',
                        x: -3,
                        y: fontSize + (unit_px / 3.5),
                    },
                    top: fhrtop,
                    height: fhrheight,
                    left: 0,
                    ordinal: false,
                    range: this.options.range * 60 * 1000,
                    minRange: this.options.range * 60 * 1000,
                    maxRange: this.options.range * 60 * 1000,
                    lineWidth: 0,
                    tickWidth: 0,
                    minPadding: 0,
                    maxPadding: 0,
                    zoomEnabled: false,
                    zIndex: 10,
                    events: {
                        afterSetExtremes: (extr) => {
                            var i = 0;
                            var next = 0;
                            while ((next = extr.min + i * 10 * 60 * 1000) < extr.max) {
                                this.$xAxisLabels[i].html(`<span style="margin-inline-end:5px;margin-inline-start: -3px;position: absolute;width: 200px;">&#129045; ${new Date(next).toStringFormated()}</span>`);
                                i++;
                            }
                            if (extr.max == this.maxX) {
                                //is at the end of chart so clear the timer
                                this.goToEndOfChart = true;
                                clearTimeout(this.goToEndOfChartTimer);
                                this.goToEndOfChartTimer = null;
                            }
                            else {
                                this.goToEndOfChart = false;
                                clearTimeout(this.goToEndOfChartTimer);
                                this.goToEndOfChartTimer = setTimeout(() => {
                                    this.goToEndOfChart = true;
                                }, this.goToEndDuration * 1000);
                            }
                        }
                    }
                },
                //toco
                {
                    id: 'toco_datetime',
                    type: 'datetime',
                    tickInterval: 10 * (1 * 60) * 1000,
                    minorTickInterval: 1 * (1 * 60) * 1000,
                    labels: {
                        enabled: false,
                        style: { fontSize: fontSize + 'px' },
                    },
                    gridLineColor: linecolor,
                    minorGridLineColor: minorlinecolor,
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    top: tocotop,
                    height: tocoheight,
                    left: 0,
                    ordinal: false,
                    range: this.options.range * 60 * 1000,
                    lineWidth: 0,
                    tickWidth: 0,
                    linkedTo: 0,
                    minPadding: 0,
                    maxPadding: 0,
                    zoomEnabled: false
                },
            ],
            yAxis: [
                //fhr labels
                {
                    id: 'y_fhr',
                    labels: {
                        enabled: false,
                        formatter: (ctx) => {
                            if (ctx.value != '50')
                                return ctx.value;
                        },
                        align: 'right',
                        x: first,
                        y: 4,
                        style: { fontSize: fontSize + 'px' }
                    },
                    plotBands: [
                        {
                            from: 50,
                            to: this.options.bradycardia,
                            color: '#f805'
                        },
                        {
                            from: this.options.tachycardia,
                            to: 210,
                            color: '#f805'
                        }
                    ],
                    tickAmount: 50,
                    top: fhrtop,
                    height: fhrheight,
                    min: fhrStart,
                    max: fhrEnd,
                    showLastLabel: true,
                    endOnTick: false,
                    alignTicks: false,
                    opposite: false,
                    minorTickInterval: 10,
                    tickInterval: 10,
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    gridLineColor: linecolor,
                    minorGridLineColor: minorlinecolor,
                    tickPositions: [50, 60, 80, 100, 120, 140, 160, 180, 200]
                },
                //toco label 
                {
                    id: 'y_toco',
                    labels: {
                        enabled: false,
                        align: 'right',
                        x: first,
                        y: 4,
                        style: { fontSize: fontSize + 'px' },
                    },
                    tickAmount: 25,
                    top: tocotop,
                    height: tocoheight,
                    min: 0,
                    max: 100,
                    showLastLabel: true,
                    endOnTick: false,
                    alignTicks: false,
                    opposite: false,
                    minorTickInterval: 10,
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    gridLineColor: linecolor,
                    minorGridLineColor: minorlinecolor,
                    tickPositions: [0, 20, 40, 60, 80, 100]
                },
            ],
            time: {
                useUTC: false,
            },
        }; //end of options
        createChartPane();
        return { options, label_font_size: label_font_size.toString(), tocotop, fhrtop, fhrheight, width, height };
    }
    findNearestPoint(createdDt) {
        var point;
        for (var i = 0; i < 1000; i++) {
            point = this.options.data[createdDt + i];
            if (point)
                break;
            else {
                point = this.options.data[createdDt - i];
                if (point)
                    break;
            }
        }
        return point;
    }
}
function concat(...args) {
    var result = {};
    for (var i = 0; i < args.length; i++) {
        for (var prop in args[i] || {}) {
            if (typeof (args[i][prop]) == 'object')
                result[prop] = concat(result[prop], args[i][prop]);
            else
                result[prop] = args[i][prop];
        }
    }
    return result;
}
async function createChart(stripChartOptions) {
    var content = await (await fetch('data.txt')).text();
    var ticks = new Date(stripChartOptions.minCreationTime).getTime();
    var recs = content.split('|');
    var data2 = recs.map(k => {
        var n = k.split(';');
        var raw = n[0].split(',').map(p => parseFloat(p));
        var type = type;
        var addedSeconds = parseInt(n[1]);
        return { raw, type, addedSeconds };
    });
    stripChartOptions.data = {};
    stripChartOptions.data2 = [];
    var prevPoint = null;
    var minTime = 0;
    var accelerationPack = [];
    var decelerationPack = [];
    var celerationCounter = 0;
    var isPreviousWas__Celeration = false;
    data2.forEach((x, i) => {
        var sec = (ticks + (x.addedSeconds * 1000)).truncateMilliSeconds();
        var note = stripChartOptions.notes.find(k => k.stripDataCreationTime.toDate().getTime() == sec);
        var point = {
            createdDtAsDate: new Date(sec),
            createdDt: sec,
            fhR1: x.raw[0] || null,
            fhR2: x.raw[1] || null,
            toco: x.raw[2] || null,
            note: note
        };
        //TODO
        // calculate the baseline  ///////////////////////////////////////////////////////////////////////
        const windowSize = 10;
        const windowSizeMilli = 10 * 60 * 1000;
        const countOfNumbers = 600;
        const { fhR1, fhR2, toco } = point;
        const timeOfCurrentPoint = point.createdDt;
        prevPoint = prevPoint;
        var prevBaseline = prevPoint?.baseline ?? point.fhR1;
        var baseline = null;
        if (i == 0)
            minTime = timeOfCurrentPoint;
        if (timeOfCurrentPoint - minTime >= windowSizeMilli)
            baseline = prevBaseline + (point.fhR1 - prevBaseline) / countOfNumbers;
        point.acceleration = false;
        point.deceleration = false;
        if (Math.abs(point.fhR1 - baseline) > 15) {
            celerationCounter++;
            var time = point.createdDt;
            if (!isPreviousWas__Celeration) {
            }
            if (point.fhR1 > baseline) {
                point.acceleration = true;
                accelerationPack.push([time, baseline, point.fhR1]);
            }
            else {
                point.deceleration = true;
                decelerationPack.push([time, point.fhR1, baseline]);
            }
            isPreviousWas__Celeration = true;
        }
        else {
            isPreviousWas__Celeration = false;
            if (celerationCounter > 15) {
                // accelerationPack.forEach(ac => this.series_fhr1_acceleration.addPoint(ac, false))
                // decelerationPack.forEach(de => this.series_fhr1_deceleration.addPoint(de, false))
            }
            accelerationPack = [];
            decelerationPack = [];
            celerationCounter = 0;
        }
        point.baseline = baseline;
        //////////////////////////////////////////////////////////////////////////////////
        stripChartOptions.data[point.createdDt] = point;
        stripChartOptions.data2.push(point);
        prevPoint = point;
    });
    var ctgChart = new CTGChart(stripChartOptions);
}
var stripChartOptions = {
    stripId: "3a126e54-2a84-e383-9845-73d0eefab144",
    laborId: "3a11aabf-9448-e16a-1ca8-f3907978b836",
    isAdmitted: false,
    patient: {
        roomName: "SUITE 1",
        roomNo: "R0001",
        patientName: "Sabna ",
        mrnNo: "1",
        age: "24Y 1M 1D",
        poa: "46W 1D",
        admittedHours: "105574W 1D",
        patientId: "3a11aaba-f664-7782-d242-b2f8934f0e3c",
        dob: null,
        admissionDate: "0001-01-01T00:00:00",
        gpm: null,
        arm: null
    },
    showColumnSizeOptions: false,
    showNavigator: true,
    range: null,
    divideDuration: null,
    isLive: true,
    showLatestValuesLabel: true,
    showExportMenu: true,
    isConnected: true,
    minCreationTime: "2024-05-10T09:49:47",
    maxCreationTime: "2024-05-13T15:33:10",
    showDisconnectedMessage: false,
    printTaskId: null,
    status: 1,
    notes: [],
    canClassifyAI: false,
    bradycardia: 100,
    tachycardia: 180,
    canEditPatient: false,
    canPrint: false,
    canViewAlertHistory: false,
    canViewNotes: false,
    canViewStripsAuditLogs: false,
};
$(async function () {
    await createChart(stripChartOptions);
});
