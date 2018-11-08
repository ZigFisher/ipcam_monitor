var urlParams = new URLSearchParams(window.location.search),
    camera = urlParams.get('camera'),
//  baseUrl = 'http://ipcam.octonix.net/~rewm/' + camera + '/',
    baseUrl = '/~rewm/' + camera + '/',
    shiftSlides = 80,
    refreshTimeout = 60;

function setLastCamsImg() {
    $('.camlist-item').each(function (i, item) {
        var cam = $(item).data('camera');
        if (cam.length > 3) {
            var dtnow = new Date(),
                datenow = dtnow.getFullYear() + '/' + getLeadingZeroNum(dtnow.getMonth() + 1) + '/' + getLeadingZeroNum(dtnow.getDate()),
                camurl = '/~rewm/' + cam + '/' + datenow;
            // camurl = 'http://localhost:63342/cam-img-to-video/example.html'; // FIXME: DEBUG!!
            $.get(camurl, function (data) {
                var htmlt = $.parseHTML(data);

                var aaa = $(htmlt).find("a").toArray();
                var imgg;
                while (true) {
                    imgg = aaa.pop();
                    imgg = $(imgg).attr('href');
                    if (imgg.substr(-4) === '.jpg') break;
                }
                var res = camurl + '/' + imgg;
                var dest = $('.camlist-item')[i];
                dest = $(dest).find('img')[0];
                $(dest).attr('src', res);
            });
        }
    })
}

$(function () {
    var datepicker = $('#picker').data('datepicker'),
        fotorama = $('#fotorama').fotorama().data('fotorama'),
        images = {},
        html = '',
        lastDate = false;

    $('#show').click(function () {
        if (!datepicker.selectedDates.length) return false;
        if (camera === null) return false;

        var dt = new Date(datepicker.selectedDates),
            date = dt.getFullYear() + '/' + getLeadingZeroNum(dt.getMonth() + 1) + '/' + getLeadingZeroNum(dt.getDate()),
            url = baseUrl + date,
            initHour = +dt.getHours(),
            initMinute = +dt.getMinutes(),
            startindex = 1;

        if (lastDate !== date) {
            // url = 'http://localhost:63343/cam-img-to-video/example.html';
            $.get(url, function (data) {
                html = $.parseHTML(data);

                lastDate = date;
                images = {};
                $(html).find("a").each(function (i, el) {
                    if (i > 0) {
                        var href = $(el).attr('href');

                        // set start index
                        var hour = href.replace('.jpg', '').split('.');
                        var minute = +hour[1];
                        hour = +hour[0];
                        if (hour <= initHour && minute <= initMinute) {
                            startindex = i - 1;
                        }

                        images[i] = {
                            img: baseUrl + date + '/' + href,
                            caption: [getLeadingZeroNum(hour), getLeadingZeroNum(minute)].join(':'),
                        };
                    }
                });
                // delete images[Object.keys(images).length];
                var toShow = sliceImages(images, startindex);

                fotorama
                    .load(toShow.images)
                    .show(toShow.startfrom);
            });
        } else {
            $(html).find("a").each(function (i, el) {
                if (i > 0) {
                    var href = $(el).attr('href');

                    // set start index
                    var hour = href.replace('.jpg', '').split('.');
                    var minute = hour[1];
                    hour = hour[0];
                    if (hour <= initHour && minute <= initMinute) {
                        startindex = i - 1;
                    }
                }
            });

            var toShow = sliceImages(images, startindex);
            fotorama
                .load(toShow.images)
                .show(toShow.startfrom);
        }
    });

    if (camera !== null) {
        $('#onecam').show();
        $('#camblock').hide();
        $('h1').html(camera);
        datepicker.selectDate(new Date());
        $('#show').click();
        var onLoad = true;
        $('#fotorama').on('fotorama:load', function (e, fotorama) {
            if (onLoad) {
                fotorama.show(shiftSlides - 1);
                onLoad = false;
            }
        });
    } else {
        $('#onecam').hide();
        $('#camblock').show();
        setLastCamsImg();
        setInterval(setLastCamsImg, refreshTimeout * 1000);
    }
});

function getLeadingZeroNum(num) {
    return parseInt(num) < 10 ? '0' + num : num;
}

function sliceImages(imgs, indx) {
    var total = Object.entries(imgs).length,
        min = indx - shiftSlides,
        max = indx + shiftSlides;

    if (min < 0) min = 0;
    if (max > total) max = total;

    var result = Object.entries(imgs).slice(min, max).map(entry => entry[1]);

    startfrom = shiftSlides;
    if (min === 0) startfrom = indx;
    if (max === total) startfrom = result.length - (total - indx);

    return {
        images: result,
        startfrom: startfrom
    };
}