var mode, mode_name;

$(document).ready(function() {
    mode_name = window.location.search.substr(1);
    if(mode_name in modes) {
        mode = modes[mode_name];
        $('title').text($('title').text() + ' - ' + mode_name.ucfirst());
        mode.init();
    } else {
        // Select a mode
        var html = '<div class="select-mode"><h1>Select a mode</h1>';
        for(mode in modes) {
            var high_score = (parseInt(localStorage.getItem('score.' + mode)) || 0);
            html += '<a href="index.html?' + mode + '">' + mode + ' <br><small>High score : ' + high_score + '</small></a>';
        }
        html += '</div>';
        $('body').empty().append(html);
    }
});

/* The functions to handle the game are defined for each mode
 * in this JSON object. For instance, modes.classic.init contains
 * the function to execute when the game starts. Note that the
 * standard functions for a mode are init, append, move, speedUp,
 * tap and lost, but the only required function is init, since
 * it is called when the document is ready.
 *
 * The modes are fetched from here in the "Select a mode" section.
 */
var modes = {
    arcade: {
        init: function() {
            $('#restart, #game-over, #quit').hide();
            mode.body_height = $('body').height();
            mode.append();
            mode.row_height = $('div').height();
            mode.speed = mode.row_height*1.1;
            mode.score = 0;
            mode.last_move = window.performance.now();
            mode.move();
            mode.scroll_top = 0;
        },
        append: function() {
            var tiles = [
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            mode.speedUp();
        },
        move: function() {
            var delta_y = (window.performance.now() - mode.last_move)/1000 * mode.speed;
            mode.last_move = window.performance.now();

            mode.scroll_top = (mode.scroll_top + delta_y);
            if(mode.scroll_top >= mode.row_height) {
                mode.append();
                mode.scroll_top=0;
            }

            $('div').css({
                top: mode.scroll_top - mode.row_height + 'px'
            }).each(function() {
                if($(this).position().top > mode.body_height) {
                    if($(this).children('.black').length) {
                        mode.lost();
                    }
                    $(this).remove();
                }
            });

            setTimeout(mode.move, 30);
        },
        speedUp: function() {
            mode.speed += mode.row_height*0.07;
        },
        tap: function(context) {
            if($(context).hasClass('black')) {
                $(context).removeClass('black');
                mode.score++;
                $('#score').text(mode.score);
            } else {
                $(context).addClass('red');
                mode.lost();
            }
            navigator.vibrate(50);
        },
        lost: function() {
            mode.move = function() {};
            $('span').removeAttr('onclick');
            $('#final-score').text(mode.score);
            localStorage.setItem('score.' + mode_name, Math.max(parseInt(localStorage.getItem('score.' + mode_name)) || 0, mode.score));
            $('#high-score').text(localStorage.getItem('score.' + mode_name));
            $('#restart, #game-over, #quit').fadeIn();
        }
    },
    classic: {
        init: function() {
            $('#restart, #game-over, #quit').hide();
            mode.body_height = $('body').height();
            mode.append();
            mode.append();
            mode.append();
            mode.append();
            mode.append();
            mode.last_move = window.performance.now();
            mode.row_height = $('div').height();
            mode.speed = mode.row_height;
            mode.score = 0;
        },
        append: function() {
            var tiles = [
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
        },
        move: function() {
            mode.append();

            $('div').each(function() {
                if($(this).position().top >= mode.body_height) {
                    if($(this).children('.black').length) {
                        mode.lost();
                    }
                    $(this).remove();
                }
            });
        },
        tap: function(context) {
            modes.arcade.tap(context);
            mode.move();
        },
        lost: function() {
            modes.arcade.lost();
        }
    },
    faster: {
        init: function() {
            modes.arcade.init();
            mode.speed = mode.row_height*2.2;
        },
        append: function() { modes.arcade.append(); },
        move: function() { modes.arcade.move(); },
        speedUp: function() {
            mode.speed += mode.row_height*0.15;
        },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    /*sprint: {
        // TODO : You've got 15 seconds to tap all the black tiles you can
    },*/
    double: {
        init: function() { modes.arcade.init(); },
        append: function() {
            modes.arcade.append();
            var double = false;
            $('div:eq(0) span:not("black")').each(function() {
                if(!double && Math.random() < 0.05) {
                    $(this).addClass('black');
                    double = true;
                }
            });
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    triple: {
        init: function() { modes.arcade.init(); },
        append: function() {
            var tiles = [
                '<span onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    trap: {
        init: function() { modes.arcade.init(); },
        append: function() {
            var tiles = [
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                Math.random() > 0.25 ? '<span class="black" onclick="tap(this)"></span>' : '<span class="trap" onclick="tap(this)"><br />/!\\</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    twice: {
        init: function() { modes.arcade.init(); },
        append: function() {
            var tiles = [
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                '<span onclick="tap(this)"></span>',
                Math.random() > 0.25 ? '<span class="black" onclick="tap(this)"></span>' : '<span class="twice" onclick="tap(this)"><br/>2x</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) {
            if($(context).hasClass('black')) {
                $(context).removeClass('black');
                mode.score++;
                $('#score').text(mode.score);
            } else if($(context).hasClass('twice')) {
                $(context).removeClass('twice').addClass('black').text('');
            } else {
                $(context).addClass('red');
                mode.lost();
            }
            navigator.vibrate(50);
        },
        lost: function() { modes.arcade.lost(); }
    },
    bastard: {
        init: function() { modes.arcade.init(); },
        append: function() {
            modes.arcade.append();
            var bastard = false;
            $('div:nth-child(2) span, div:nth-child(3) span').each(function() {
                if(!bastard && Math.random() < 0.15) {
                    $(this).addClass('black');
                    bastard = true;
                }
            });
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    hardcore: {
        init: function() { modes.arcade.init(); },
        append: function() {
            var tiles = [
                '<span class="black" onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>',
                '<span class="black" onclick="tap(this)"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    disco: {
        init: function() { modes.arcade.init(); },
        append: function() {
            modes.arcade.append();
            $('span').each(function() {
                $(this).css({
                    backgroundColor: "rgba(" + rand_int(0, 256) + ", " + rand_int(0, 256) + ", " + rand_int(0, 256) + ", 0.5)"
                });
            });
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    }
};

// Shortcut for onclick attributes
function tap(context) {
    mode.tap(context);
}

function rand_int(min_rand, max_rand) {
    return parseInt(min_rand + (Math.random()*1000 % (max_rand - min_rand)));
}

String.prototype.ucfirst = function() {
    var string = this.split('');
    string[0] = string[0].toUpperCase();
    return string.join('');
}
