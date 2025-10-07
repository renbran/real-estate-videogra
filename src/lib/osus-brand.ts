// OSUS Brand Identity Configuration
// Updated with Burgundy/Maroon Color Scheme from Design Samples and Odoo Color Values

export const OSUS_BRAND = {
  // Primary Brand Colors - Burgundy/Maroon Palette based on RGB(125, 21, 56)
  colors: {
    primary: {
      50: '#fdf2f4',
      100: '#fce7ea', 
      200: '#f9d4db',
      300: '#f4b3c0',
      400: '#ec8ea0',
      500: '#7d1538', // Primary Burgundy from Odoo (125, 21, 56)
      600: '#6b1230',
      700: '#5a0f28',
      800: '#4a0c20',
      900: '#3d0a1b',
      950: '#2c0713'
    },
    secondary: {
      50: '#fffcf0',
      100: '#fef7d9',
      200: '#fdedb3', 
      300: '#fbdf83',
      400: '#f9cc52',
      500: '#d4af37', // Gold accent for luxury feel matching design samples
      600: '#b8941f',
      700: '#9c7b1a',
      800: '#806315',
      900: '#654c11',
      950: '#4a360c'
    },
    neutral: {
      50: '#f8f6f3', // Warm neutral matching RGB(248, 246, 243)
      100: '#f1ede8',
      200: '#e2d8d0',
      300: '#cbb8a8',
      400: '#a3917f',
      500: '#64544a', // Matching Odoo dark primary RGB(44, 24, 16)
      600: '#524339',
      700: '#423529',
      800: '#32281d',
      900: '#241d14',
      950: '#18130e'
    },
    // Odoo-inspired semantic colors
    success: '#228b22', // RGB(34, 139, 34)
    warning: '#c9a810', // RGB(201, 169, 110) 
    error: '#b22234', // RGB(178, 34, 52)
    info: '#9a355d' // RGB(154, 30, 66)
  },

  // Typography following design samples
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Georgia', 'Times New Roman', 'serif'], // For luxury branding
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem', 
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },

  // Logo specifications from brand guidelines
  logo: {
    emblem: {
      construction: {
        ratio: '2:7:2', // Based on the 2X:7X:2X construction
        minSize: '24px',
        clearSpace: '2x' // 2x the logo height
      }
    },
    logotype: {
      minSize: '120px',
      clearSpace: '1x'
    },
    colors: {
      primary: '#7d1538', // Burgundy
      secondary: '#d4af37', // Gold
      monochrome: '#ffffff'
    }
  },

  // Spacing system based on 2X guidelines
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '1rem',    // 16px (1X)
    lg: '2rem',    // 32px (2X - base unit)
    xl: '4rem',    // 64px (4X)
    '2xl': '8rem', // 128px (8X)
    '3xl': '16rem' // 256px (16X)
  },

  // Component-specific styling
  components: {
    card: {
      background: {
        primary: '#ffffff',
        secondary: '#fdf2f4',
        accent: 'linear-gradient(135deg, #7d1538 0%, #6b1230 100%)'
      },
      border: {
        color: '#f9d4db',
        radius: '0.75rem'
      },
      shadow: {
        sm: '0 1px 2px 0 rgba(125, 21, 56, 0.05)',
        md: '0 4px 6px -1px rgba(125, 21, 56, 0.1), 0 2px 4px -1px rgba(125, 21, 56, 0.06)',
        lg: '0 10px 15px -3px rgba(125, 21, 56, 0.1), 0 4px 6px -2px rgba(125, 21, 56, 0.05)'
      }
    },
    button: {
      primary: {
        background: 'linear-gradient(135deg, #7d1538 0%, #6b1230 100%)',
        hover: 'linear-gradient(135deg, #6b1230 0%, #5a0f28 100%)',
        text: '#ffffff'
      },
      secondary: {
        background: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
        hover: 'linear-gradient(135deg, #b8941f 0%, #9c7b1a 100%)',
        text: '#ffffff'
      },
      outline: {
        border: '#7d1538',
        text: '#7d1538',
        hover: {
          background: '#7d1538',
          text: '#ffffff'
        }
      }
    },
    badge: {
      variants: {
        primary: {
          background: '#7d1538',
          text: '#ffffff'
        },
        secondary: {
          background: '#d4af37', 
          text: '#ffffff'
        },
        success: {
          background: '#e6f7e6',
          text: '#228b22',
          border: '#228b22'
        },
        warning: {
          background: '#fff8e1',
          text: '#c9a810',
          border: '#c9a810'
        },
        error: {
          background: '#fde8e8',
          text: '#b22234',
          border: '#b22234'
        }
      }
    }
  },

  // Gradient definitions for luxury feel
  gradients: {
    primary: 'linear-gradient(135deg, #7d1538 0%, #6b1230 100%)',
    secondary: 'linear-gradient(135deg, #d4af37 0%, #b8941f 100%)',
    accent: 'linear-gradient(135deg, #7d1538 0%, #d4af37 50%, #7d1538 100%)',
    background: 'linear-gradient(135deg, #fdf2f4 0%, #ffffff 50%, #fffcf0 100%)',
    luxury: 'linear-gradient(135deg, #7d1538 0%, #d4af37 25%, #7d1538 50%, #d4af37 75%, #7d1538 100%)'
  },

  // Animation and transition settings
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // Dark mode colors based on Odoo dark mode values
  darkMode: {
    colors: {
      primary: {
        500: '#d4af37', // Gold becomes primary in dark mode RGB(212, 175, 55)
        600: '#b8941f',
        700: '#9c7b1a'
      },
      background: {
        primary: '#18130e',
        secondary: '#241d14',
        accent: '#32281d'
      },
      text: {
        primary: '#f8f6f3', // RGB(248, 246, 243)
        secondary: '#cbb8a8',
        accent: '#d4af37'
      }
    }
  }
}

// Utility functions for color manipulation
export const getBrandColor = (colorPath: string, opacity?: number) => {
  const pathParts = colorPath.split('.')
  let color = OSUS_BRAND.colors
  
  for (const part of pathParts) {
    color = color[part as keyof typeof color] as any
  }
  
  if (typeof color === 'string' && opacity !== undefined) {
    // Convert hex to rgba if opacity is provided
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  
  return color as string
}

export const getGradient = (gradientName: keyof typeof OSUS_BRAND.gradients) => {
  return OSUS_BRAND.gradients[gradientName]
}

export default OSUS_BRAND