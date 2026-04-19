// razorpay.ts
// Utility to load Razorpay script and open payment modal

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById('razorpay-script')) return resolve()
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Razorpay'))
    document.body.appendChild(script)
  })
}

export function openRazorpayCheckout(options: any) {
  // @ts-ignore
  const rzp = new window.Razorpay(options)
  rzp.open()
}
