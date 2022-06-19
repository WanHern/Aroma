

// Listeners for the edit buttons
$("#add").click(function() {
    window.location.href = '/supplier/home'
})

$("#cancel").click(function() {
    window.location.href = '/supplier/home'
})

$("#confirm-pass").click(function() {
    $('#submission-success').delay(500).fadeIn('normal', function() {
        $(this).delay(3500).fadeOut();
     }); 
})
    

