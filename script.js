function scrollGrid(direction) {
    const grid = document.getElementById('concerns-grid');
    const scrollAmount = 170; // Width of one card (150px) + gap (20px)
    if (direction === 'left') {
        grid.scrollLeft -= scrollAmount;
    } else {
        grid.scrollLeft += scrollAmount;
    }
}

function showForm(formType) {
    // Toggle form visibility
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById(formType + '-form').classList.add('active');

    // Toggle button active state
    document.getElementById('login-toggle').classList.remove('active');
    document.getElementById('signup-toggle').classList.remove('active');
    document.getElementById(formType + '-toggle').classList.add('active');
}