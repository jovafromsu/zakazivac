import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Zakazivač</h3>
            <p className="text-gray-300 text-sm">
              The easiest way to book services from trusted providers in your area.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Customers</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/browse" className="hover:text-white">Browse Services</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How it Works</Link></li>
              <li><Link href="/support" className="hover:text-white">Customer Support</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">For Providers</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/become-provider" className="hover:text-white">Join as Provider</Link></li>
              <li><Link href="/dashboard/provider" className="hover:text-white">Provider Dashboard</Link></li>
              <li><Link href="/provider-resources" className="hover:text-white">Resources</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300 text-sm">
          <p>&copy; 2025 Zakazivač. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}