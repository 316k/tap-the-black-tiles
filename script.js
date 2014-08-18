var mode, mode_name, last_focus = false, time_delay = 0;

$(document).ready(function() {
    mode_name = window.location.search.substr(1);
    if(mode_name in modes) {
        mode = modes[mode_name];
        $('title').text($('title').text() + ' - ' + mode_name.ucfirst());

        // Pause time on lost focus
        window.onblur = function() {
            last_focus = window.performance.now();
        }

        window.onfocus = function() {
            if(last_focus) {
                time_delay += window.performance.now() - last_focus;
                last_focus = false;
            }
        }

        // Bugfix for Firefox OS
        setTimeout(mode.init, 100);
    } else {
        // Select a mode
        var html = '<div class="select-mode"><h1>Select a mode</h1>';
        for(mode in modes) {
            var high_score = (parseInt(localStorage.getItem('score.' + mode)) || 0);
            html += '<a href="index.html?' + mode + '">' + mode.replace('_', ' ') + ' <br><small>High score : ' + high_score + '</small></a>';
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
            mode.speed = mode.row_height*2;
            mode.score = 0;
            mode.last_move = time();
            mode.move();
            mode.scroll_top = 0;
            mode.row_height = $('div').height();
            mode.body_height = $('body').height();
        },
        append: function() {
            var tiles = [
                '<span></span>',
                '<span></span>',
                '<span></span>',
                '<span class="black"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
            mode.speedUp();
        },
        move: function() {
            if(!time()) {
                setTimeout(mode.move, 3);
                return;
            }

            var delta_y = (time() - mode.last_move)/1000 * mode.speed;
            mode.last_move = time();

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
                        $(this).children('.black').removeClass('black').addClass('red');
                        mode.move = function() {};
                        $('div').animate({
                            top: (-2*mode.row_height) + 'px'
                        }, 1000, function() {
                            mode.lost();
                        });
                    } else {
                        $(this).remove();
                    }
                }
            });

            setTimeout(mode.move, 30);
        },
        speedUp: function() {
            mode.speed += mode.row_height*0.05;
        },
        tap: function(context) {
            if($(context).hasClass('black')) {
                $(context).removeClass('black').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
        lost: function() {
            $('span').unbind('touchstart');
            $('#final-score').text(mode.score);
            localStorage.setItem('score.' + mode_name, Math.max(parseInt(localStorage.getItem('score.' + mode_name)) || 0, mode.score));
            $('#high-score').text(localStorage.getItem('score.' + mode_name));
            $('#restart, #game-over, #quit').fadeIn(2000);
        }
    },
    zen: {
        init: function() {
            $('#restart, #game-over, #quit').hide();
            mode.body_height = $('body').height();
            mode.append();
            mode.append();
            mode.append();
            mode.append();
            mode.last_move = time();
            mode.row_height = $('div').first().height();
            mode.speed = mode.row_height;
            mode.score = 0;
        },
        append: function() {
            var tiles = [
                '<span></span>',
                '<span></span>',
                '<span></span>',
                '<span class="black"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
        },
        move: function() {
            mode.append();
            $('div').css({
                top: (-mode.row_height) + 'px'
            }).animate({
                top: '0px'
            }, 100);

            $('div').each(function() {
                if($(this).position().top >= mode.body_height) {
                    if($(this).children('.black').length) {
                        $('div').animate({
                            top: (-mode.row_height) + 'px'
                        }, 1000, function() {
                            mode.lost();
                        });
                        mode.lost();
                    } else {
                        $(this).remove();
                    }
                }
            });
        },
        tap: function(context) {
            if($(context).hasClass('black')) {
                $(context).removeClass('black').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
            mode.move();
        },
        lost: function() {
            modes.arcade.lost();
        }
    },
    faster: {
        init: function() {
            modes.arcade.init();
            mode.speed = mode.row_height*3.3;
        },
        append: function() { modes.arcade.append(); },
        move: function() { modes.arcade.move(); },
        speedUp: function() {
            mode.speed += mode.row_height*0.15;
        },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    flash: {
        init: function() { modes.arcade.init(); mode.flash(); mode.invert = 0; },
        append: function() { modes.arcade.append(); mode.flash(); },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); },
        flash: function() {
            if(mode.invert == 3) {
                $('span').css({backgroundColor: 'black'});
            } else {
                $('span').css({backgroundColor: 'transparent'});
            }
            mode.invert++;
            mode.invert %= 4;
        }
    },
    endurance: {
        init: function() { modes.arcade.init(); },
        append: function() { modes.arcade.append(); },
        move: function() { modes.arcade.move(); },
        speedUp: function() {},
        tap: function(context) { modes.arcade.tap(context); },
        lost: function() { modes.arcade.lost(); }
    },
    random_speed: {
        init: function() { modes.arcade.init(); },
        append: function() { modes.arcade.append(); },
        move: function() { modes.arcade.move(); },
        speedUp: function() {
            mode.speed = mode.row_height * (Math.random() * 7) + mode.row_height/2;
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
                '<span></span>',
                '<span class="black"></span>',
                '<span class="black"></span>',
                '<span class="black"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
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
                '<span></span>',
                '<span></span>',
                '<span></span>',
                Math.random() > 0.25 ? '<span class="black"></span>' : '<span class="trap"><br />/!\\</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
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
                '<span></span>',
                '<span></span>',
                '<span></span>',
                Math.random() > 0.25 ? '<span class="black"></span>' : '<span class="twice"><br/>2x</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
        },
        move: function() { modes.arcade.move(); },
        speedUp: function() { modes.arcade.speedUp(); },
        tap: function(context) {
            if($(context).hasClass('black')) {
                $(context).removeClass('black').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if($(context).hasClass('twice')) {
                $(context).removeClass('twice').addClass('black').text('');
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
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
                '<span class="black"></span>',
                '<span class="black"></span>',
                '<span class="black"></span>',
                '<span class="black"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
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

function tap(context) {
    if(!time()) {
        return;
    }
    mode.tap(context);
}

function rand_int(min_rand, max_rand) {
    return parseInt(min_rand + (Math.random()*1000 % (max_rand - min_rand)));
}

function time() {
    if(last_focus) {
        return 0;
    }

    return window.performance.now() + time_delay;
}

String.prototype.ucfirst = function() {
    var string = this.split('');
    string[0] = string[0].toUpperCase();
    return string.join('');
}
