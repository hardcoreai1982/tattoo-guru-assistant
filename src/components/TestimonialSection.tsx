
import React from 'react';

const testimonials = [
  {
    quote: "Tattoo Buddy helped me refine my design concept and find the perfect artist for my first tattoo. The AI feedback on my sketch was impressively detailed!",
    author: "Jamie Smith",
    role: "First-time Tattoo Client",
    image: "https://randomuser.me/api/portraits/women/33.jpg",
  },
  {
    quote: "As a tattoo artist, I use Tattoo Buddy to explore different styles and get fresh ideas. It's like having a knowledgeable colleague to bounce ideas off of.",
    author: "Michael Ramirez",
    role: "Professional Tattoo Artist",
    image: "https://randomuser.me/api/portraits/men/54.jpg",
  },
  {
    quote: "The aftercare advice from Tattoo Buddy was spot-on and helped my tattoo heal beautifully. I love how it adapts recommendations to your specific ink.",
    author: "Taylor Johnson",
    role: "Tattoo Enthusiast",
    image: "https://randomuser.me/api/portraits/women/67.jpg",
  },
];

const TestimonialSection: React.FC = () => {
  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What People Are <span className="gradient-text">Saying</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Hear from tattoo enthusiasts and professional artists who have transformed their tattoo experience with Tattoo Buddy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
            >
              <div className="mb-6">
                <svg className="w-10 h-10 text-tattoo-purple opacity-20" fill="currentColor" viewBox="0 0 32 32" aria-hidden="true">
                  <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-6 italic">
                "{testimonial.quote}"
              </p>
              <div className="flex items-center">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold">{testimonial.author}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
