function entry() {
  if(!WATunnel || !WATunnel.isOpened){
    setTimeout('entry()',1000);
    WATunnel.open()
    console.log('trying open tunnle');
  }else {
    setTimeout('entry()',1000);
    WATunnel.deliver({hello:"hi"})
    console.log('sending message');

  }
}

entry();
