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

        mode_inheritance(mode);

        // Bugfix for Firefox OS
        setTimeout(mode.init, 100);
    } else {
        // Select a mode
        var html = '<div class="select-mode"><h1>Select a mode</h1>';
        for(mode in modes) {
            var high_score = (parseInt(localStorage.getItem('score.' + mode)) || 0);
            html += '<a href="index.html?' + mode + '">' + mode.replace('_', ' ') + ' <br><small>High score : ' + high_score + '</small></a>';
        }
        html += '<a href="about.html"><br />About this game...</a>';
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

            mode.check_death();

            setTimeout(mode.move, 30);
        },
        check_death: function() {
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
            $('#game-over').fadeIn(2000);
            $('#restart, #quit').delay(800).fadeIn('1200');
        },
        freeze: function(timeout) {
            var speed = mode.speed;
            var tap = mode.tap;
            var speedUp = mode.speedUp;
            mode.speed = 0;
            mode.tap = function() {};
            mode.speedUp = function() {};
            setTimeout(function() {
                mode.speed = speed;
                mode.tap = tap;
                mode.speedUp = speedUp;
            }, timeout);
        }
    },
    zen: {
        init: function() {
            $('#restart, #game-over, #quit').hide();
            mode.body_height = $('body').height();
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
                            top: (-mode.row_height*2) + 'px'
                        }, 1000, function() {
                            mode.lost();
                        });
                        $(this).children('.black').removeClass('black').addClass('red');
                        mode.lost();
                    } else {
                        $(this).remove();
                    }
                }
            });
        },
        tap: function(context) {
            if($(context).hasClass('black') && !$(context).parent().next('div').find('.black').length) {
                $(context).removeClass('black').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
                mode.move();
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
        lost: function() {
            modes.arcade.lost();
        }
    },
    faster: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            mode.speed = mode.row_height*3.3;
        },
        speedUp: function() {
            mode.speed += mode.row_height*0.15;
        },
    },
    flash: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            mode.flash();
            mode.invert = 0;
        },
        append: function() {
            modes.arcade.append();
            mode.flash();
        },
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
        parent: 'arcade',
        speedUp: function() {},
    },
    faster_endurance: {
        parent: 'faster',
        speedUp: function() {},
    },
    random_speed: {
        parent: 'arcade',
        speedUp: function() {
            mode.speed = mode.row_height * (Math.random() * 5) + mode.row_height/2;
        },
    },
    backwards: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            $('body, #score').css({
                transform: 'rotate(180deg)'
            });
        },
        lost: function() {
            modes.arcade.lost();
            $('body, #score').css({
                transition: 'transform 1s ease-in-out 0s',
                transform: 'rotate(0deg)'
            });
        }
    },
    /*sprint: {
        // TODO : You've got 15 seconds to tap all the black tiles you can
    },*/
    double: {
        parent: 'arcade',
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
    },
    triple: {
        parent: 'arcade',
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
    },
    trap: {
        parent: 'arcade',
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
    },
    twice: {
        parent: 'arcade',
        append: function() {
            var tiles = [
                '<span></span>',
                '<span></span>',
                '<span></span>',
                Math.random() > 0.25 ? '<span class="black"></span>' : '<span class="twice black"><br/>2x</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
        },
        tap: function(context) {
            if($(context).hasClass('black') && !$(context).hasClass('twice')) {
                $(context).removeClass('black').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if($(context).hasClass('twice')) {
                $(context).removeClass('twice').text('');
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
    },
    bastard: {
        parent: 'arcade',
        append: function() {
            modes.arcade.append();
            var bastard = false;
            $('div:nth-child(1) span, div:nth-child(2) span').each(function() {
                if(!bastard && Math.random() < 0.15) {
                    $(this).addClass('black');
                    bastard = true;
                }
            });
        },
    },
    hardcore: {
        parent: 'arcade',
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
    },
    disco: {
        parent: 'arcade',
        append: function() {
            modes.arcade.append();
            var that = this;
            $('span').each(function() {
                $(this).css({
                    backgroundColor: that.colors.choose(),
                });
            });
        },
        colors: ['#00C', '#0CC', '#0C0', '#CC0', '#C0C', '#C00']
    },
    deterministic: {
        parent: 'arcade',
        append: function() {
            var tiles = [];
            for(var i = 0; i<4; i++) {
                tiles.push(i == this.next() ? '<span class="black"></span>' : '<span></span>');
            }
            this.row++;
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
        },
        row: 0,
        next: function() { return Math.round(Math.abs(Math.sin(mode.row * 13729 + 9))*13*13*13) % 4 }
    },
    loop: {
        parent: 'deterministic',
        init: function() {
            mode.loop = [0, 1, 2, 3, 0, 1, 2, 3].sort(function() {
                return Math.random() > 0.5;
            });
            modes.deterministic.init();
        },
        next: function() { return mode.loop[mode.row % mode.loop.length] }
    },
    odd_numbers: {
        parent: 'arcade',
        append: function() {
            var number = rand_int(0, 100);
            var tiles = [
                '<span></span>',
                '<span></span>',
                '<span></span>',
                '<span class="black' + (number % 2 ? ' good' : '') + '"><br />' + number + '</span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            mode.speedUp();
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
        },
        check_death: function() {
            $('div').css({
                top: mode.scroll_top - mode.row_height + 'px'
            }).each(function() {
                if($(this).position().top > mode.body_height) {
                    if($(this).children('.good').length) {
                        $(this).children('.good').removeClass('good').addClass('red');
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
        },
        tap: function(context) {
            if($(context).hasClass('good')) {
                $(context).removeClass('black').removeClass('good').addClass('gray').text('');
                mode.score++;
                $('#score').text(mode.score);
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
    },
    annoying_circle: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            $('body').children().first().before('<p id="blocking-circle"></p>');
            mode.move_circle();
        },
        move_circle: function() {
            $('#blocking-circle').animate({
                top: rand_int(0, 0.8 * mode.body_height) + 'px',
                left: rand_int(0, $('body').width()/2) + 'px',
            }, 1200, mode.move_circle);
        }
    },
    flip: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            $('body, #score').css({
                transition: 'transform 0.1s ease-in-out 0s'
            });
            setTimeout(function() {
                mode.transform();
            }, rand_int(4000, 16000));
        },
        transform_state: -1,
        transform: function() {
            mode.freeze(600);
            $('body, #score').css({
                transform: 'scale(' + mode.transform_state + ', 1)'
            });
            mode.transform_state = -mode.transform_state;
            setTimeout(function() {
                mode.transform()
            }, rand_int(4000, 16000));
        },
        lost: function() {
            modes.arcade.lost();
            mode.transform = function() {};
            $('body, #score').css({
                transform: 'scale(1, 1)',
                transitionDuration: '1s',
            });
        }
    },
    rotate: {
        parent: 'flip',
        transform_state: 180,
        transform: function() {
            mode.freeze(600);
            $('body, #score').css({
                transform: 'rotate(' + mode.transform_state + 'deg)',
            });
            mode.transform_state += 180;
            setTimeout(function() {
                mode.transform();
            }, rand_int(4000, 16000));
        },
        lost: function() {
            modes.arcade.lost();
            mode.transform = function() {};
            $('body, #score').css({
                transform: 'rotate(0deg)',
                transitionDuration: '1s',
            });
        }
    },
    zig_zag: {
        parent: 'flip',
        init: function() {
            modes.arcade.init();
            $('body, #score').css({
                transition: 'transform 1s ease-in-out 0s'
            });
            mode.transform_state = parseInt($('body').width()/7);
            mode.transform();
        },
        transform: function() {
            $('body, #score').css({
                transform: 'translate(' + mode.transform_state + 'px)',
            });
            mode.transform_state = -mode.transform_state;
            setTimeout(function() {
                mode.transform();
            }, 1000);
        },
    },
    freeze: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();

            setTimeout(function() {
                mode.stop();
            }, rand_int(4000, 9000));
        },
        stop: function() {
            var timeout = rand_int(500, 2300);
            mode.freeze(timeout);
            $('body').fadeTo('fast', 0.5);

            setTimeout(function() {
                $('body').fadeTo('fast', 1);
            }, timeout);

            setTimeout(function() {
                mode.stop();
            }, rand_int(4000, 9000));
        },
        lost: function() {
            modes.arcade.lost();
            mode.stop = function() {};
            $('body').fadeTo('fast', 1);
        }
    },
    scramble: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();

            setTimeout(function() {
                mode.scramble();
            }, rand_int(4000, 9000));
        },
        scramble: function() {
            mode.freeze(200);

            $('div').each(function() {
                var tile = $(this).children('.black, .gray');
                tile.remove();
                var reference_tile = $(this).children(':eq(' + rand_int(0, $(this).children().length) + ')');
                if(Math.random() < 0.5) {
                    reference_tile.before(tile);
                } else {
                    reference_tile.after(tile);
                }
                // Rebind event
                tile.bind('touchstart', function() { tap(this) });
            });

            setTimeout(function() {
                mode.scramble();
            }, rand_int(4000, 9000));
        },
        lost: function() {
            modes.arcade.lost();
            mode.scramble = function() {};
            $('body').fadeTo('fast', 1);
        }
    },
    right_color: {
        parent: 'arcade',
        init: function() {
            modes.arcade.init();
            $('body').children().first().before('<p id="color-indicator"></p><p id="time-indicator"></p>');
            mode.last_color_modification = -3000;
            mode.next_color = mode.colors.choose();
            mode.change_color();
            mode.speed = mode.row_height*3;
        },
        append: function() {
            var tiles = [
                '<span></span>',
                '<span></span>',
                '<span></span>',
                '<span class="good" style="background-color: ' + mode.colors.choose() + '"></span>'
            ].sort(function(){
                // Random sort
                return Math.random() > 0.5;
            });
            $('body').children().first().before('<div>' + tiles.join('') + '</div>');
            $('body div').first().children().bind('touchstart', function() { tap(this) });
            mode.speedUp();
        },
        check_death: function() {
            $('div').css({
                top: mode.scroll_top - mode.row_height + 'px'
            }).each(function() {
                if($(this).position().top > mode.body_height) {
                    if($(this).children('.good[style="background-color: ' + mode.color + '"]').length
                       && $(this).position().top > mode.body_height - mode.row_height) {
                        $(this).children('.good').removeClass('good').addClass('red');
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
        },
        tap: function(context) {
            if($(context).hasClass('good') && $(context).css('backgroundColor') == mode.color) {
                $(context).removeClass('good').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
        speedUp: function() {},
        lost: function() {
            modes.arcade.lost();
            mode.change_color = function() {};
        },
        change_color: function() {
            var ts = time();
            if(mode.last_color_modification + 3000 < ts) {
                $('.good[style="background-color: ' + mode.next_color + '"]').each(function() {
                    // Tolerence for tiles that are almost outside of the screen
                    if($(this).parent().position().top > mode.body_height - 1.2 * mode.row_height) {
                        $(this).removeClass('good').addClass('gray');
                    }
                });
                mode.color = mode.next_color;
                mode.next_color = mode.colors.choose();
                $('#time-indicator').css('backgroundColor', mode.next_color);
                $('#color-indicator').css({backgroundColor: mode.color});
                mode.last_color_modification = ts;
            } else {
                var percent = Math.abs(Math.round((mode.last_color_modification - ts)/3000*100));
                $('#time-indicator').width(percent + '%');
            }
            setTimeout(mode.change_color, 30);
        },
        colors: ['rgb(255, 0, 255)', 'rgb(0, 0, 255)', 'rgb(0, 200, 0)', 'rgb(255, 255, 0)', 'rgb(0, 0, 0)'],
        color: '', // current color
        next_color: '',
        last_color_modification: 0,
    },
    mirror: {
        parent: 'arcade',
        append: function() {
            modes.arcade.append();
            $('div').first().children().each(function(index) {
                if($($(this).parent().children().get(3 - index)).hasClass('black')) {
                    $(this).addClass('good');
                }
            });
        },
        check_death: function() {
            $('div').css({
                top: mode.scroll_top - mode.row_height + 'px'
            }).each(function() {
                if($(this).position().top > mode.body_height) {
                    if($(this).children('.good').length) {
                        $(this).children('.good').removeClass('good').addClass('red');
                        mode.move = function() {};
                        $('div').animate({
                            top: (-2*mode.row_height) + 'px'
                        }, 1000, function() {
                            mode.lost();
                        });
                    } else if($(this).position().top > mode.body_height) {
                        $(this).remove();
                    }
                }
            });
        },
        tap: function(context) {
            if($(context).hasClass('good')) {
                $(context).removeClass('good').addClass('gray');
                mode.score++;
                $('#score').text(mode.score);
            } else if(!$(context).hasClass('gray')) {
                $(context).addClass('red');
                mode.move = function() {};
                mode.lost();
            }
            navigator.vibrate(50);
        },
    }
};

function tap(context) {
    if(!time()) {
        return;
    }
    mode.tap(context);
}

/**
 * Copies the parent's methods for a given `mode`. The
 * methods overloaded by `mode` are ignored.
 */
function mode_inheritance(mode) {
    // Mode inheritance
    if('parent' in mode) {
        var parent = mode.parent;
        if('parent' in modes[parent]) {
            mode_inheritance(modes[parent]);
        }
        for(var action in modes[parent]) {
            if(!(action in mode)) {
                mode[action] = modes[parent][action];
            }
        }
    }
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

Array.prototype.choose = function() {
    return this[Math.floor(Math.random() * this.length)];
};

String.prototype.ucfirst = function() {
    var string = this.split('');
    string[0] = string[0].toUpperCase();
    return string.join('');
};
