(function () {
    'use strict'
  
    document.querySelector('#navbarSideCollapse').addEventListener('click', function () {
      document.querySelector('.offcanvas-collapse').classList.toggle('open')
    });
    document.querySelector('#navbarSideCollapse').addEventListener('click', function () {
      // If no 'offcanvas-open'
        // turn off scrolling
      // If has 'offcanvas-open'
        // turn on scrolling
  
      document.querySelector("#appBody").classList.toggle('offcanvas-open');
    });
  
    
  })()
  