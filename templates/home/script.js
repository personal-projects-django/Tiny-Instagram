// ثبت‌نام
document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('http://localhost:8000/register/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            document.getElementById('message').innerText = data.message;
            // نمایش پیام و انتقال به صفحه تأیید OTP
            setTimeout(() => {
                window.location.replace('http://127.0.0.1:8000/otp/')
            }, 2000);
        } else {
            document.getElementById('message').innerText = data.error || "خطای نامشخص";
        }
    })
    .catch(error => {
        document.getElementById('message').innerText = 'خطای شبکه';
    });
});

// فرم تایید OTP
document.getElementById('verify-otp-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    fetch('http://localhost:8000/verify_otp/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            document.getElementById('message').innerText = data.message;
            // انتقال به صفحه اصلی بعد از تأیید
            setTimeout(() => {
                window.location.href = "login.html";
            }, 2000);
        } else if (data.error === "OTP expired, new OTP sent.") {
            // اگر OTP منقضی شده باشد، پیام خطا داده می‌شود
            document.getElementById('message').innerText = "OTP expired, please request a new code.";

            // نمایش دکمه درخواست مجدد OTP
            document.getElementById('resend-otp').style.display = 'block';
        } else {
            document.getElementById('message').innerText = data.error || "خطای نامشخص";
        }
    })
    .catch(error => {
        document.getElementById('message').innerText = 'خطای شبکه';
    });
});

// ارسال درخواست مجدد OTP
document.getElementById('resend-otp').addEventListener('click', function() {
    const email = document.getElementById('email').value;

    fetch('http://localhost:8000/api/resend-otp/', {  // فرض کردیم API برای ارسال OTP مجدد "/api/resend-otp/" است
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            document.getElementById('message').innerText = data.message;
        } else {
            document.getElementById('message').innerText = data.error || "خطای نامشخص";
        }
    })
    .catch(error => {
        document.getElementById('message').innerText = 'خطای شبکه';
    });
});
