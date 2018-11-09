$(function () {
    var urlParams = new URLSearchParams(window.location.search),
        camera = urlParams.get('camera'),
        refresh = urlParams.get('refresh'),
        datepicker = $('#picker').data('datepicker'),
        fotorama = $('#fotorama').fotorama().data('fotorama'),
        refreshTimeout = 60;

    $('#refresh').prop('checked', refresh);

    if (camera !== null) {
        $('#onecam').show();
        $('#camblock').hide();
        $('h2').html(camera);
        datepicker.selectDate(new Date()); // set now as default datetime

        let cameraClass = new CamImg(camera, datepicker, fotorama);

        cameraClass.showPictures();
        cameraClass.setRefresh(refresh); // if refresh = true set interval

    } else {
        $('#onecam').hide();
        $('#camblock').show();
        setLastCamsImg();
        setInterval(setLastCamsImg, refreshTimeout * 1000);
    }


    $('#show').click(function () {
        if (!datepicker.selectedDates.length) return false;
        if (camera === null) return false;
        let cameraClass = new CamImg(camera, datepicker, fotorama); //get exists with singleton

        cameraClass.showPictures();
    });

    $('#refresh').change(function () {
        refresh = $(this).prop('checked');
        console.log(refresh);
        let cameraClass = new CamImg(camera, datepicker, fotorama); //get exists with singleton

        cameraClass.setRefresh(refresh); // if refresh = true set interval
    })
});


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


function getLeadingZeroNum(num) {
    return parseInt(num) < 10 ? '0' + num : num;
}

