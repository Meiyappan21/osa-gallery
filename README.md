# OpenSourceAvatars.com

A collection of CC0 and open source avatars for the metaverse, games, VR, and creative projects.

## 🌟 About the Project

OpenSourceAvatars.com is a platform dedicated to providing high-quality, freely available 3D avatars. What began as a showcase for ToxSam's personal collection of CC0 avatars has evolved into an ambitious mission to become the internet's central hub for discovering and downloading open source 3D characters.

Currently the collection includes over 300 metaverse-ready avatars, including the original 200+ VRM avatars from the 100avatars challenge created in 2018 and 2020, with more being added regularly.

### Vision

Our goal is to build the most comprehensive library of high-quality CC0 and Creative Commons 3D avatars available online. We want to make it easy for developers, creators, and enthusiasts to find and use well-made avatars for:

- Games and interactive experiences
- VR applications and virtual worlds
- Creative and artistic projects
- AI training and educational purposes

All with no strings attached!

## 🚀 Current Status

- **Super Beta**: The platform is in its early stages with continuous updates
- **300+ Avatars**: Growing collection of 3D characters
- **Multiple Formats**: Primarily VRM, with FBX versions also available
- **Voxel Variants**: Voxel versions of many avatars are available
- **Permanent Storage**: All avatars are stored on ArDrive for longevity
- **Multilingual Support**: Full Japanese localization available
- **VRM Inspector**: Advanced tool for analyzing VRM avatar files

## 🔄 Recent Updates

- Added 100 more VRM avatars to the collection
- Created voxel versions of the original 100 Avatars from Round 1 and Round 2
- Added FBX versions for both regular and voxel variants
- Upgraded from CloudFlare buckets to permanent ArDrive storage
- Migrated data to the new open-source-avatars database repository for increased transparency
- Added full Japanese language support
- Implemented VRM Inspector tool for advanced avatar analysis

## 💡 Development Story

This website was developed in just 4 days using AI tools like Claude, ChatGPT, and Bolt.new, with further updates implemented using Claude 3.7 Sonnet through Cursor. The project demonstrates how modern AI tools can empower creators with limited programming experience to build functional web applications.

## 🔮 Future Plans

- Continue adding more open source avatars
- Release the upcoming Grifters collection
- Begin incorporating CC0 avatars from other talented creators
- Improve the 3D gallery viewer with better navigation tools

## 💻 Technical Information

This repository contains the codebase for OpenSourceAvatars.com, a Next.js application built with:

- Next.js and React
- Tailwind CSS for styling
- ArDrive for permanent avatar storage
- GitHub for data management through the open-source-avatars repository

### Data Architecture

The project uses a two-repository approach:
- **osa-gallery**: This main application repository with all code and UI components ([GitHub](https://github.com/ToxSam/osa-gallery))
- **open-source-avatars**: A separate repository containing all avatar data in JSON format ([GitHub](https://github.com/ToxSam/open-source-avatars))

This separation allows for better data management, transparency, and community contributions.

## 🔧 Special Features

### VRM Inspector

The VRM Inspector is a powerful analysis tool that allows you to:
- Examine detailed metadata from VRM avatar files
- View and test facial expressions and blendshapes
- Analyze textures with format details
- See technical specifications like polygon count, materials, and bone structure
- Visualize the avatar's skeleton and wireframe

Access the VRM Inspector (implemented as the VRMInspector component) from the main navigation menu under "Viewer" or directly at `/vrmviewer`.

### Multilingual Support

The site features complete Japanese localization with an easy language switcher in the navigation bar. All major sections including the VRM Inspector, avatar gallery, and resource pages are fully translated.

## 🤝 Contributing

Interested in contributing avatars or helping with development? We welcome contributions from the community! Feel free to:

- Report bugs or suggest features
- Help improve the codebase
- Contribute to translations

## 📱 Get in Touch

- Twitter: [@ToxSam](https://twitter.com/ToxSam)
- Website: [ToxSam.com](https://toxsam.com)

## 📜 License

All code in this repository is available under the MIT License.

The 3D avatar models featured on OpenSourceAvatars.com are primarily released under Creative Commons CC0 licenses, making them free to use, modify, and distribute for any purpose, including commercial projects.
