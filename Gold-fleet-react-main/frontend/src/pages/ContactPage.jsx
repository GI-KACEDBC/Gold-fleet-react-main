import React, { useState } from 'react';
import Header from '../components/Header';

/**
 * Contact Page
 * Form allowing users to send messages or find contact details
 */
export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send message');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Contact submit error:', error);
      alert('Failed to send message. Please try again later.');
    }
  };

  return (
    <div className="w-full">
      <Header sidebarOpen={false} setSidebarOpen={() => {}} />

      {/* Hero */}
      <header className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Get in Touch</h1>
          <p className="mt-4 text-lg max-w-xl mx-auto">
            We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
          </p>
        </div>
      </header>

      {/* Contact Form + Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-2">Thanks for reaching out!</h2>
                <p>We received your message and will respond shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows="4"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Contact Information</h2>
            <p className="text-gray-700">
              <strong>Email:</strong> support@goldfleet.com
            </p>
            <p className="text-gray-700">
              <strong>Phone:</strong> +233 000000000
            </p>
            <p className="text-gray-700">
              <strong>Address:</strong> 123 Coffee Street, Suite 400, Ghana
            </p>
            <p className="text-gray-700">
              You can also reach out to us via our social channels or schedule a demo through the website.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
