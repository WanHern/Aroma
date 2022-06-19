

// Listeners for the edit buttons
$("#confirm").click(function() {
    window.location.href = '/supplier/home'
})

$("#cancel").click(function() {
    window.location.href = '/supplier/home'
})

$("#image-submit").click(function() {
    $('#submission-success').delay(500).fadeIn('normal', function() {
        $(this).delay(3500).fadeOut();
     }); 
})

    
