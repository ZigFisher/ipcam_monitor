$(function () {
    let urlParams = new URLSearchParams(window.location.search),
        camera = urlParams.get('camera'),
        refresh = urlParams.get('refresh'),
        config = urlParams.get('config'),
        date = urlParams.get('date'),
        time = urlParams.get('time'),
        datepicker = $('#picker').data('datepicker'),
        fotorama = $('#fotorama').fotorama().data('fotorama'),
        refreshTimeout = 60;

    $('#refresh').prop('checked', refresh);

    if (camera !== null) {
        $('#onecam').show();
        $('#camblock').hide();
        $('h2').html(camera);

        CamImg.parseConfig(config)
            .then(cfg => {
                let descr = cfg.cameras[camera];
                $('h3').html(descr);

                if (date && time) {
                    datepicker.selectDate(new Date(date + ' ' + time)); // set now as default datetime
                } else {
                    datepicker.selectDate(new Date()); // set now as default datetime
                }

                let cameraClass = new CamImg(camera, datepicker, fotorama);

                putConfigHtml(config)
                    .then(config => cameraClass.setConfig(config))
                    .then(() => {
                        cameraClass.showPictures();
                        cameraClass.setRefresh(refresh); // if refresh = true set interval
                    })
            });
    } else {
        $('#onecam').hide();
        $('#camblock').show();
        putConfigHtml(config)
            .then(() => {
                setLastCamsImg();
                setInterval(setLastCamsImg, refreshTimeout * 1000);
            });

    }


    $('#show').click(function () {
        if (!datepicker.selectedDates.length) return false;
        if (camera === null) return false;
        let cameraClass = new CamImg(camera, datepicker, fotorama); //get exists with singleton

        cameraClass.showPictures();
    });

    $('#refresh').change(function () {
        refresh = $(this).prop('checked');
        let cameraClass = new CamImg(camera, datepicker, fotorama); //get exists with singleton

        cameraClass.setRefresh(refresh); // if refresh = true set interval
    });

    $('#makeurl').click(function () {
        let date = new Date(datepicker.selectedDates);
        date = date.getFullYear() + '-' + getLeadingZeroNum(date.getMonth() + 1) + '-' + getLeadingZeroNum(date.getDate());
        let time = $('.fotorama__active .fotorama__caption__wrap').html();

        let theURL = new URL(window.location);
        theURL.searchParams.set('date', date);
        theURL.searchParams.set('time', time);
        $('#url').val(theURL.toString()).toggle();
        if ($('#url').is(":visible")) {
            document.getElementById('url').select();
            document.execCommand("Copy");
        }
    });
});


function setLastCamsImg() {
    $('.camlist-item').each(function (i, item) {
        let cam = $(item).data('camera');
        if (cam.length > 3) {
            let dtnow = new Date(),
                datenow = dtnow.getFullYear() + '/' + getLeadingZeroNum(dtnow.getMonth() + 1) + '/' + getLeadingZeroNum(dtnow.getDate()),
                camurl = '/~rewm/' + cam + '/' + datenow;
            // camurl = 'http://localhost:63342/cam-img-to-video/example.html'; // FIXME: DEBUG!!
            $.get(camurl, function (data) {
                let htmlt = $.parseHTML(data);

                let aaa = $(htmlt).find("a").toArray();
                let imgg;
                while (true) {
                    imgg = aaa.pop();
                    imgg = $(imgg).attr('href');
                    if (imgg.substr(-4) === '.jpg') break;
                }
                let res = camurl + '/' + imgg;
                let dest = $('.camlist-item')[i];
                dest = $(dest).find('img')[0];

                CamImg.parseConfig(window.config)
                    .then(cfg => {
                        let dieTtl = cfg.dieCamTimeout || 5;
                        let d = new Date();
                        let lastpic = imgg.replace('.jpg', '').split('.');
                        let now = d.getHours() * 60 + d.getMinutes();
                        lastpic = parseInt(lastpic[0]) * 60 + parseInt(lastpic[1]) + dieTtl;
                        if (lastpic >= now)
                            $(dest).attr('src', res);
                    });

            });
        }
    })
}


function getLeadingZeroNum(num) {
    return parseInt(num) < 10 ? '0' + num : num;
}

function putConfigHtml(config) {
    return new Promise((resolve, reject) => {
        if (typeof config === 'undefined' || !config) config = 'config.json';
        $.get(config, function (data) {
            $('.navbar-brand').html('<i class="fa fa-flask"></i> ' + data.name);
            $('title').html(data.name);
            $('#footer-credential').attr('href', data.url).html(data.name);
            if (!Object.keys(data).length) return resolve();
            if (Object.keys(data.cameras).length) {
                $('#camblock .row').empty();
                $('#cammenu').empty();
                Object.keys(data.cameras).forEach(function (mac) {
                    let div = document.createElement("div");
                    div.className = 'col-xs-12 col-sm-6 col-md-4 camlist-item';
                    div.dataset.camera = mac;
                    div.innerHTML = '<a href="index.html?camera=' + mac + '"><img src="" alt=""></a>' +
                        '<span class="onhover">' + data.cameras[mac] + '</span>';
                    $('#camblock .row').append(div);

                    let li = document.createElement("li");
                    li.innerHTML = '<a href="?camera=' + mac + '"><i class="fa fa-camera-retro"></i> &nbsp; ' + data.cameras[mac] + '</a></li><li role="separator" class="divider">';
                    $('#cammenu').append(li);
                });
            }
            return resolve();
        });
    });
}