import DrawBlob, {generatePoints} from 'blob-animated';

// animated gradient blob drawn on the fixed background canvas in index.html
function drawBlob(){
  return new DrawBlob({
    canvas: document.getElementById('blob'),
    speed: 1500,
    scramble: 0.9,
    vectors: generatePoints({ sides: 4 }),
    color: '#ff66cc',
    colorFunction: (ctx) => {
      const gradient = ctx.createLinearGradient(0,0, 1024,1024);

      // Add three color stops
      gradient.addColorStop(.3, 'HotPink');
      // gradient.addColorStop(.5, 'cyan');
      gradient.addColorStop(1, 'Aqua');
      return gradient;
    }
  })
}

export default drawBlob
