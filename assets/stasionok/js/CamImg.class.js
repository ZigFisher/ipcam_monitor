class CamImg {
    constructor(camera, datepicker, fotorama) {
        if (typeof CamImg.inst === 'undefined') CamImg.inst = {};

        if (typeof CamImg.inst[camera] !== 'undefined' && typeof CamImg.inst[camera]) return CamImg.inst[camera];

        CamImg.inst[camera] = this;
        this.imagesList = [];
        this.user = 'rewm';
        this.camera = camera;
        this.baseUrl = '/~' + this.user + '/' + camera + '/';
        this.startIndex = 1;
        this.shiftSlides = 80;
        this.refreshTimeout = 60;
        this.refreshOneCamTimeout = 60;
        this.datepicker = datepicker;
        this.fotorama = fotorama;

        this.initHour = 0;
        this.initMinute = 0;
        return this;
    }

    setConfig(config) {
        if (typeof config === 'undefined' || !config) config = 'config.json';
        return new Promise((resolve, reject) => {
            $.get(config, function (data) {
                if (!Object.keys(data).length) return resolve();
                this.user = typeof data.user !== 'undefined' ? data.user : this.user;
                this.baseUrl = '/~' + this.user + '/' + this.camera + '/';
                this.shiftSlides = typeof data.shiftSlides !== 'undefined' ? data.shiftSlides : this.shiftSlides;
                this.refreshTimeout = typeof data.refreshTimeout !== 'undefined' ? data.refreshTimeout : this.refreshTimeout;
                this.refreshOneCamTimeout = typeof data.refreshOneCamTimeout !== 'undefined' ? data.refreshOneCamTimeout : this.refreshOneCamTimeout;
                return resolve();
            });
        });

    }

    getFullUrl() {
        let date = this.getDateTime();
        let url = date.getFullYear() + '/' + this.getLeadingZeroNum(date.getMonth() + 1) + '/' + this.getLeadingZeroNum(date.getDate());
        return this.baseUrl + url;
    }

    getHtml() {
        return new Promise((resolve, reject) => {
            let url = this.getFullUrl();
            // url = 'http://localhost:63343/cam-img-to-video/example.html'; // FIXME: DEBUG!!

            $.get(url, function (data) {
                if (!data.length) return reject('Can`t get filelists');
                let html = $.parseHTML(data);
                return resolve(html);
            });
        });
    }

    getImagesList() {
        return this.getHtml()
            .then((html) => {
                this.imagesList = $(html).find("a").toArray();
                return this.imagesList;
            });


    }

    sliceImages(images) {
        var total = Object.entries(images).length,
            indx = this.startIndex,
            min = indx - this.shiftSlides,
            max = indx + this.shiftSlides;

        if (min < 0) min = 0;
        if (max > total) max = total;

        var result = Object.entries(images).slice(min, max).map(entry => entry[1]);

        this.startIndex = this.shiftSlides;
        if (min === 0) this.startIndex = indx;
        if (max === total) this.startIndex = result.length - (total - indx);

        return result;
    }

    setDatepicker(datepicker) {
        this.datepicker = datepicker;
    }

    setFotorama(fotorama) {
        this.fotorama = fotorama;
    }

    getPictures() {
        return new Promise((resolve, reject) => {
            this.getInitTime();
            this.getImagesList()
                .then(() => {
                    let images = {},
                        fullUrl = this.getFullUrl(),
                        _this = this;

                    this.imagesList.forEach(function (el, i) {
                        if (i > 0) {
                            let href = $(el).attr('href');

                            // set start index
                            let hour = href.replace('.jpg', '').split('.');
                            let minute = +hour[1];
                            hour = +hour[0];
                            if (hour <= _this.initHour && minute <= _this.initMinute) {
                                _this.startIndex = i - 1;
                            }

                            images[i] = {
                                img: fullUrl + '/' + href,
                                caption: _this.getLeadingZeroNum(hour) + ':' + _this.getLeadingZeroNum(minute),
                            };
                        }
                    });

                    return resolve(images);
                });
        });
    }

    showPictures() {
        this.getPictures()
            .then(images => {
                let sliced = this.sliceImages(images);
                if (sliced.length) {
                    this.fotorama
                        .load(sliced)
                        .show(this.startIndex);
                }
            });
    }

    setRefresh(refresh) {
        if (!refresh) {
            if (this.refresh) {
                clearInterval(this.refresh);
                this.refresh = false;
            }
            return true;
        }

        let _this = this;

        this.refresh = setInterval(function () {
            let current = _this.getDateTime();
            _this.datepicker.selectDate(new Date(current.getTime() + _this.refreshOneCamTimeout * 1000));
            return _this.showPictures();
        }, this.refreshOneCamTimeout * 1000);
    }

    getInitTime() {
        let dt = this.getDateTime();
        this.initHour = +dt.getHours();
        this.initMinute = +dt.getMinutes();
    }

    getLeadingZeroNum(num) {
        return parseInt(num) < 10 ? '0' + num : num;
    }

    getDateTime() {
        return new Date(this.datepicker.selectedDates);
    }
}