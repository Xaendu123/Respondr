import React, { useState } from 'react';
import { Camera, Mail, Lock, User, Heart, Star, MessageCircle, Share2 } from 'lucide-react';

export default function GlassmorphismTutorial() {
  const [activeTab, setActiveTab] = useState('basics');
  const [formData, setFormData] = useState({ email: '', password: '' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">
          Glassmorphism in React
        </h1>
        <p className="text-white/90 text-center text-lg">
          A complete guide to creating stunning glass effects with Tailwind CSS
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="backdrop-blur-md bg-white/10 rounded-2xl p-2 border border-white/20 shadow-2xl">
          <div className="flex gap-2">
            {['basics', 'components', 'advanced'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-white/30 text-white shadow-lg'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* BASICS TAB */}
        {activeTab === 'basics' && (
          <div className="space-y-8">
            {/* What is Glassmorphism */}
            <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">What is Glassmorphism?</h2>
              <p className="text-white/90 text-lg leading-relaxed mb-6">
                Glassmorphism is a design trend that creates a frosted glass effect with transparency, blur, and subtle borders. It became popular in modern UI design for its elegant, depth-rich appearance.
              </p>
              
              <h3 className="text-2xl font-bold text-white mb-3">Key Properties:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Background Blur</h4>
                  <code className="text-pink-200 text-sm">backdrop-blur-md</code>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Transparency</h4>
                  <code className="text-pink-200 text-sm">bg-white/10</code>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Subtle Border</h4>
                  <code className="text-pink-200 text-sm">border border-white/20</code>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-semibold mb-2">Shadow</h4>
                  <code className="text-pink-200 text-sm">shadow-2xl</code>
                </div>
              </div>
            </div>

            {/* Basic Example */}
            <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-4">Basic Implementation</h2>
              
              <div className="bg-black/20 rounded-xl p-6 mb-6">
                <pre className="text-green-300 text-sm overflow-x-auto">
{`<div className="backdrop-blur-lg bg-white/10 
            rounded-3xl p-8 
            border border-white/20 
            shadow-2xl">
  <h2 className="text-white">Glass Card</h2>
  <p className="text-white/80">Content goes here</p>
</div>`}
                </pre>
              </div>

              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-2">Live Preview</h3>
                <p className="text-white/80">This is a basic glass card with blur and transparency</p>
              </div>
            </div>

            {/* Blur Variations */}
            <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Blur Intensity Variations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="backdrop-blur-sm bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">backdrop-blur-sm</h3>
                  <p className="text-white/70 text-sm">Light blur effect</p>
                </div>
                <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">backdrop-blur-md</h3>
                  <p className="text-white/70 text-sm">Medium blur effect</p>
                </div>
                <div className="backdrop-blur-xl bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">backdrop-blur-xl</h3>
                  <p className="text-white/70 text-sm">Heavy blur effect</p>
                </div>
              </div>
            </div>

            {/* Opacity Variations */}
            <div className="backdrop-blur-lg bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Opacity Variations</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">5%</h3>
                  <p className="text-white/70 text-sm">bg-white/5</p>
                </div>
                <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">10%</h3>
                  <p className="text-white/70 text-sm">bg-white/10</p>
                </div>
                <div className="backdrop-blur-md bg-white/20 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">20%</h3>
                  <p className="text-white/70 text-sm">bg-white/20</p>
                </div>
                <div className="backdrop-blur-md bg-white/30 rounded-xl p-6 border border-white/20">
                  <h3 className="text-white font-bold mb-2">30%</h3>
                  <p className="text-white/70 text-sm">bg-white/30</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMPONENTS TAB */}
        {activeTab === 'components' && (
          <div className="space-y-8">
            {/* Login Form */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Glass Login Form</h2>
              
              <div className="max-w-md mx-auto backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/30 shadow-2xl">
                <div className="flex justify-center mb-6">
                  <div className="backdrop-blur-md bg-white/20 p-4 rounded-full">
                    <User className="w-12 h-12 text-white" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h3>
                
                <div className="space-y-4">
                  <div className="backdrop-blur-md bg-white/5 rounded-xl border border-white/20 overflow-hidden">
                    <div className="flex items-center p-4">
                      <Mail className="w-5 h-5 text-white/70 mr-3" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-transparent border-none outline-none text-white placeholder-white/50 flex-1"
                      />
                    </div>
                  </div>
                  
                  <div className="backdrop-blur-md bg-white/5 rounded-xl border border-white/20 overflow-hidden">
                    <div className="flex items-center p-4">
                      <Lock className="w-5 h-5 text-white/70 mr-3" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-transparent border-none outline-none text-white placeholder-white/50 flex-1"
                      />
                    </div>
                  </div>
                  
                  <button className="w-full backdrop-blur-md bg-white/20 hover:bg-white/30 text-white font-semibold py-3 rounded-xl border border-white/30 transition-all duration-300 shadow-lg hover:shadow-xl">
                    Sign In
                  </button>
                </div>
              </div>

              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <pre className="text-green-300 text-xs overflow-x-auto">
{`<div className="backdrop-blur-lg bg-white/10 
            rounded-2xl p-8 
            border border-white/30">
  <input className="backdrop-blur-md 
                    bg-white/5 
                    rounded-xl 
                    border border-white/20" />
</div>`}
                </pre>
              </div>
            </div>

            {/* Card Grid */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Glass Cards</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                  <div className="backdrop-blur-sm bg-gradient-to-br from-pink-500/30 to-purple-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Photography</h3>
                  <p className="text-white/70 text-sm">Capture stunning moments with professional quality</p>
                </div>

                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                  <div className="backdrop-blur-sm bg-gradient-to-br from-blue-500/30 to-cyan-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Premium</h3>
                  <p className="text-white/70 text-sm">Unlock exclusive features and benefits</p>
                </div>

                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group">
                  <div className="backdrop-blur-sm bg-gradient-to-br from-orange-500/30 to-red-500/30 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Favorites</h3>
                  <p className="text-white/70 text-sm">Save and organize your favorite content</p>
                </div>
              </div>
            </div>

            {/* Notification */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Glass Notification</h2>
              
              <div className="max-w-md mx-auto backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/30 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="backdrop-blur-md bg-gradient-to-br from-green-400/30 to-emerald-500/30 p-3 rounded-full">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold mb-1">New Message</h4>
                    <p className="text-white/70 text-sm mb-3">You have a new message from Sarah</p>
                    <button className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg border border-white/30 transition-all duration-300">
                      View Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            {/* Layered Glass */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Layered Glass Effect</h2>
              
              <div className="relative h-64 backdrop-blur-sm bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-8 border border-white/30 shadow-2xl">
                    <div className="backdrop-blur-md bg-white/10 rounded-xl p-6 border border-white/20">
                      <h3 className="text-white font-bold text-xl mb-2">Triple Layer</h3>
                      <p className="text-white/70">Each layer adds depth</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <pre className="text-green-300 text-xs overflow-x-auto">
{`<div className="backdrop-blur-sm bg-white/5">
  <div className="backdrop-blur-lg bg-white/10">
    <div className="backdrop-blur-md bg-white/10">
      Content
    </div>
  </div>
</div>`}
                </pre>
              </div>
            </div>

            {/* Gradient Glass */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Gradient Glass</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="backdrop-blur-lg bg-gradient-to-br from-white/20 to-white/5 rounded-2xl p-8 border border-white/30">
                  <h3 className="text-white font-bold text-xl mb-2">Light to Dark</h3>
                  <p className="text-white/70">Smooth gradient transition</p>
                </div>
                
                <div className="backdrop-blur-lg bg-gradient-to-tr from-pink-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl p-8 border border-white/30">
                  <h3 className="text-white font-bold text-xl mb-2">Colorful Glass</h3>
                  <p className="text-white/70">Multi-color gradient</p>
                </div>
              </div>

              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <pre className="text-green-300 text-xs overflow-x-auto">
{`<div className="backdrop-blur-lg 
            bg-gradient-to-br 
            from-white/20 to-white/5 
            rounded-2xl 
            border border-white/30">
  Content
</div>`}
                </pre>
              </div>
            </div>

            {/* Interactive Glass */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Interactive Glass</h2>
              
              <div className="flex gap-4 justify-center">
                <button className="backdrop-blur-md bg-white/10 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  Hover Me
                </button>
                
                <button className="backdrop-blur-md bg-white/10 hover:bg-white/25 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all duration-300 hover:shadow-2xl">
                  Click Me
                </button>
                
                <button className="group backdrop-blur-md bg-white/10 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all duration-300 hover:shadow-2xl overflow-hidden relative">
                  <span className="relative z-10">Animated</span>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </button>
              </div>

              <div className="mt-6 bg-black/20 rounded-xl p-4">
                <pre className="text-green-300 text-xs overflow-x-auto">
{`<button className="backdrop-blur-md 
                   bg-white/10 
                   hover:bg-white/25 
                   hover:scale-105 
                   transition-all duration-300">
  Button
</button>`}
                </pre>
              </div>
            </div>

            {/* Social Card */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Complete Example: Social Card</h2>
              
              <div className="max-w-md mx-auto backdrop-blur-lg bg-white/10 rounded-2xl border border-white/30 shadow-2xl overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-purple-500/50 to-pink-500/50 backdrop-blur-sm"></div>
                
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="backdrop-blur-md bg-white/20 w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center -mt-12">
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Jane Doe</h3>
                      <p className="text-white/70 text-sm">UI/UX Designer</p>
                    </div>
                  </div>
                  
                  <p className="text-white/80 text-sm mb-4">
                    Creating beautiful and functional interfaces with modern design principles
                  </p>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                      <Heart className="w-4 h-4" />
                      Like
                    </button>
                    <button className="flex-1 backdrop-blur-md bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg border border-white/20 transition-all duration-300 flex items-center justify-center gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Practices */}
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6">Best Practices</h2>
              
              <div className="space-y-4">
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-bold mb-2">✓ Use Colorful Backgrounds</h4>
                  <p className="text-white/70 text-sm">Glassmorphism looks best with vibrant gradients behind it</p>
                </div>
                
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-bold mb-2">✓ Balance Opacity</h4>
                  <p className="text-white/70 text-sm">Too transparent = hard to read. Too opaque = not glassy</p>
                </div>
                
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-bold mb-2">✓ Add Subtle Borders</h4>
                  <p className="text-white/70 text-sm">Semi-transparent borders enhance the glass effect</p>
                </div>
                
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-bold mb-2">✓ Layer Thoughtfully</h4>
                  <p className="text-white/70 text-sm">Multiple glass layers create depth but don't overdo it</p>
                </div>
                
                <div className="backdrop-blur-md bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-white font-bold mb-2">✓ Consider Performance</h4>
                  <p className="text-white/70 text-sm">Backdrop blur can be expensive on low-end devices</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto mt-12">
        <div className="backdrop-blur-lg bg-white/10 rounded-2xl p-6 border border-white/20 text-center">
          <p className="text-white/80">
            Built with React + Tailwind CSS • Experiment and create your own glass designs!
          </p>
        </div>
      </div>
    </div>
  );
}