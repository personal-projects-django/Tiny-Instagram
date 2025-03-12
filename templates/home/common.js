// ------------ توابع عمومی ------------
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

// چک کردن وضعیت لاگین
function checkAuth() {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
        window.location.href = '/login/';
        return false;
    }
    return true;
}

// هندل خطاهای عمومی
function handleError(error) {
    console.error(error);
    document.getElementById('error-message')?.classList.remove('hidden');
}

// لاگ اوت
function logout() {
    localStorage.removeItem('access_token');
    window.location.href = '/login/';
}