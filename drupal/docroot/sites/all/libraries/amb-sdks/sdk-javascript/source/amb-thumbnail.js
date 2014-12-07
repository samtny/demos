var ambThumbnail = function(){

    var $ = this;
    var c  = document.createElement( 'canvas' );
    var _width = 100;
    var _height = 100;
    var ctx = c.getContext( '2d' );

    /**
     * Add a thumbnail on the outputSelector. Once it is done a call happens to callback function.
     * @param file
     * @param outputSelector
     * @param callBack
     */
    $.addThumbnail = function(file, outputSelector, callBack) {
        var reader = new FileReader();
        reader.readAsDataURL( file );
        reader.onload = function ( ev ) {
            $.loadImage(ev.target.result, outputSelector);
            callBack();
        };
    };
    $.loadImage = function(file, outputSelector) {
        var img = new Image();
        img.src = file;
        img.onload = function() {
            drawToCanvas( this, _width, _height, outputSelector);
        };
    };
    function drawToCanvas( img, thumbwidth, thumbheight, outputSelector) {
        c.width = thumbwidth;
        c.height = thumbheight;
        var dimensions = resize( img.width, img.height, thumbwidth, thumbheight );
        ctx.drawImage(
            img, dimensions.x, dimensions.y, dimensions.w, dimensions.h
        );

        var thumb = new Image();
        var url = c.toDataURL();
        thumb.src = url;
        thumb.title = Math.round( url.length / 1000 * 100 ) / 100 + ' KB';
        document.querySelector(outputSelector).appendChild( thumb );

    };
    function resize( imagewidth, imageheight, thumbwidth, thumbheight ) {
        var w = 0, h = 0, x = 0, y = 0,
            widthratio  = imagewidth / thumbwidth,
            heightratio = imageheight / thumbheight,
            maxratio    = Math.max( widthratio, heightratio );
        if ( maxratio > 1 ) {
            w = imagewidth / maxratio;
            h = imageheight / maxratio;
        } else {
            w = imagewidth;
            h = imageheight;
        }
        x = ( thumbwidth - w ) / 2;
        y = ( thumbheight - h ) / 2;
        return { w:w, h:h, x:x, y:y };
    };

    return(this);
};