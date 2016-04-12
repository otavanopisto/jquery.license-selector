(function() {
  'use strict';

  $(document).ready(function () {
    $('#cc-license')
      .val('https://creativecommons.org/publicdomain/zero/1.0/')
      .licenseSelector({
        types: {
          'other': false,
          'ogl': false
        }
      });
    
    $('#ogl-license')
      .licenseSelector({
        types: {
          'cc0-1.0': false,
          'cc-4.0': false,
          'cc-3.0': false
        }
      });
    
    $('#all-license')
      .licenseSelector();
    
    $('#fi-license')
      .licenseSelector({
        locale:'fi'
      });
  });
  
}).call(this);