EchoNest = {
  api: {key: 'L43HGLG52GLEI4DJD', consumer: '205534026f8e6c28e7d9d250ddb49c3c', secret: 'g3Z0wa6RRZ6FVtAmkKaB4Q'},
  search: function(){
    artist = $('input#artist').val();
    title = $('input#title').val();
    $.get('http://developer.echonest.com/api/v4/song/search', {api_key: this.api.key, artist: artist, title: title}).success(this.results.bind(this));
  },
  results: function(data){
    if(data.response.songs.length > 0){
      id = data.response.songs[0].id;
      $.get('http://developer.echonest.com/api/v4/song/profile', {api_key: this.api.key, id: id, bucket: 'audio_summary'}).success(this.update_data.bind(this));
    }
  },
  update_data: function(data){
    if(data.response.songs.length > 0){
      audio_summary = data.response.songs[0].audio_summary;
      Synth.tempo_field.val(audio_summary.tempo);
      Synth.update_interval();
      Synth.set_key(audio_summary.key);
      console.log(audio_summary.key);
    }
  }
};

Deezer = {

};

Grid = {

  bead_array: {},
  init: function(){
    this.grid = $('table#grid');
    this.tracks = $('table#grid tr');
    this.beads = $('table#grid tr td');
    this.load_grid();
    this.beads.on('click', this.toggle_activate.bind(this));
  },
  
  load_grid: function (){
    $.each(this.tracks, function(idx, track){
      track = $(track);
      this.bead_array[track.attr('id')] = [];
      $.each(track.find('td'), function(idx, beat){
        this.bead_array[track.attr('id')].push(beat);
      }.bind(this));
    }.bind(this));
  },

  reset: function(){
    this.beads.removeClass('current');
  },

  highlight: function(beat){
    $.each(this.bead_array, function(k, v){
      $(v[beat - 1]).addClass('current');
    }.bind(this));
  },

  toggle_activate: function(ev){
    bead = $(ev.target).parent('td');
    bead.toggleClass('active');
    //if (bead.hasClass('active'))
      //Synth.bang(bead.parents('tr').attr('id'));
  },

  is_active: function(key, idx){
    //console.log($(this.bead_array['kick'][idx - 1]).hasClass('active'));
    return $(this.bead_array[key][idx - 1]).hasClass('active');
  }
};

Synth = {
  key: [0,0,0,0,0],
  keys: [
    [130.81 ,155.56 , 174.61, 196.00 , 233.08], 
    [138.59, 164.81, 185.00, 207.65, 246.94],
    [146.83, 174.61, 196.00, 220.00, 261.63], 
    [155.56, 185.00, 207.65, 233.08, 277.18], 
    [164.81, 196.00, 220.00, 246.94, 293.66],
    [174.61, 207.65, 233.08, 261.63, 311.13 ],
    [185.00, 220.00, 246.94, 277.18, 329.63], 
    [196.00, 233.08, 261.63, 293.66, 349.23], 
    [415.30, 493.88, 554.37, 622.25, 739.99],
    [246.94, 293.66, 329.63, 369.99, 440.00],
    [466.16, 554.37, 622.25, 698.46, 830.61]],
  key_synths: [],
  init: function(){
    this.synths = {
      hh: T("*", T("hpf", 6000, T("noise")),
               env = T("perc", r=20)),
      kick: T("*", 
        T('+', 
          T("sin", 40), 
          T("sin", 100, 0.1)),
        T("perc", a=1, r=200)),
      snare: T('*',
        T('+',
          T('saw', 100),
          T('saw', 500, 0.2),
          T('saw', 2000, 0.2),
          T('saw', 5000, 0.2),
          T('noise')),
        T('perc', a=0, r=50))
    };
    $.each(this.key, function(idx, frq){
      this.key_synths.push(
        T('*', T('+', T('sin', frq/2, 0.1), T('sin', frq, 0.1), T('sin', frq * 2, 0.1)), T('perc', a=5, r=1000))
        );
    }.bind(this));
    $.each(this.key, function(idx, frq){
      this.key_synths.push(
        T('*', T('+', T('sin', frq , 0.1), T('sin', frq * 2, 0.1), T('sin', frq * 4, 0.1)), T('perc', a=5, r=1000))
        );
    }.bind(this));
    $.each(this.key_synths, function(idx, synth){
      synth.play();
    });
    this.synths.kick.onplay = function() {
      this.timer = T("interval", this.interval, this.play_beat.bind(this));
      this.timer.on();
    }.bind(this);
    this.synths.kick.onpause = function() {
      this.timer.off();
    }.bind(this);
    this.tempo_field = $('input#tempo');
    this.tempo_field.on('change', this.update_interval.bind(this));
    this.update_interval();
    this.set_key(0);
  },

  set_key: function(key){
    $('span#key-display').html(MHD14.notes[key]);
    this.key = this.keys[key];
    $.each(this.key, function(idx, frq){
      this.key_synths[idx].args[0].args[0].freq = frq / 2;
      this.key_synths[idx].args[0].args[1].freq = frq;
      this.key_synths[idx].args[0].args[2].freq = frq * 2;
      this.key_synths[idx + 5].args[0].args[0].freq = frq ;
      this.key_synths[idx + 5].args[0].args[1].freq = frq * 2;
      this.key_synths[idx + 5].args[0].args[2].freq = frq * 4;
    }.bind(this));
  },

  play_key: function(key){
    console.log(key);
    this.key_synths[key].args[1].bang();
  },

  update_interval: function (){
    this.tempo = parseFloat(this.tempo_field.val());
    $('span#tempo-display').html(this.tempo);
    this.interval = 60./this.tempo*1000./4;
    if (this.timer)
      this.timer.interval = this.interval;
  },

  bump_tempo: function(){
    this.tempo_field.val(parseInt(this.tempo_field.val()) + 1);
    this.update_interval();
  },

  drop_tempo: function(){
    this.tempo_field.val(parseInt(this.tempo_field.val()) - 1);
    this.update_interval();
  },

  play_beat: function (){
    MHD14.play_beat();
    $.each(this.synths, function (k, v){
      if (Grid.is_active(k, MHD14.current_beat))
        this.bang(k);      
    }.bind(this));
  },
  bang: function(key){
    this.synths[key].args[1].bang();
  },
  play: function(){
    $.each(this.synths, function(idx, synth){
      synth.play();
    });
  },
  pause: function(){
    $.each(this.synths, function(idx, synth){
      synth.pause();
    });
  }
};

MHD14 = {
  controls: {},
  playing: false,
  current_beat: 0,
  keys: {97: 0, 122: 1, 101: 2, 114: 3, 116: 4, 121: 5, 117: 6, 105: 7, 111: 8, 112: 9},
  notes: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
  scroll_top: 0,
  key: 0,
  init: function(){
    this.controls.toggle_play = $('input#toggle-play');
    this.controls.toggle_play.on('click', this.toggle_play.bind(this));
    Grid.init();
    Synth.init(); 
    $('html').on('keypress', this.handle_keys.bind(this));
    $('input#search').on('click', function(){EchoNest.search();});
  },

  handle_keys: function(event){
    console.log(event.which);
    if ($(event.target).is('input'))
      return;
    if (event.which == 32)
      this.toggle_play();
    $.each(this.keys, function(k, v){
      if (event.which == k){
        this.key = v;
        Synth.play_key(v);
      }
    }.bind(this));
    if (event.which == 62){
      this.key = this.key == 11 ? 0 : this.key + 1;
      Synth.set_key(this.key);
    }
    if (event.which == 60){
      this.key = this.key == 0 ? 11 : this.key - 1;
      Synth.set_key(this.key); 
    }
    if (event.which == 43)
      Synth.bump_tempo();
    if (event.which == 45)
      Synth.drop_tempo();
  },

  toggle_play: function(){
    if (this.playing) {
      this.controls.toggle_play.val('PLAY');
      this.playing = false;
      Synth.pause();
      Grid.reset();
      this.current_beat = 0;
    }else{
      this.playing = true;
      Synth.play();
      //setInterval(this.play_beat.bind(this), this.interval);
      this.controls.toggle_play.val('STOP');
    }
  },

  play_beat: function(){
    this.current_beat = this.current_beat >= 16 ? 1 : this.current_beat + 1;
    Grid.reset();
//    this.pause_all();
    if (this.playing){
      Grid.highlight(this.current_beat);
      //this.play();
    }
    else
      this.current_beat = 0;
  },

};


$(document).ready(function(){
  MHD14.init();
});