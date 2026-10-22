import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const surface = {
  0: '#ffffff',
  50: '{slate.50}',
  100: '{slate.100}',
  200: '{slate.200}',
  300: '{slate.300}',
  400: '{slate.400}',
  500: '{slate.500}',
  600: '{slate.600}',
  700: '{slate.700}',
  800: '{slate.800}',
  900: '{slate.900}',
  950: '{slate.950}'
};

export const SiwPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.500}',
      600: '{indigo.600}',
      700: '{indigo.700}',
      800: '{indigo.800}',
      900: '{indigo.900}',
      950: '{indigo.950}'
    },

    focusRing: {
      width: '2px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px'
    },

    formField: {
      borderRadius: '10px'
    },

    colorScheme: {
      light: {
        surface,

        primary: {
          color: '{indigo.600}',
          inverseColor: '#ffffff',
          hoverColor: '{indigo.700}',
          activeColor: '{indigo.800}'
        }
      },

      dark: {
        surface,

        primary: {
          color: '{indigo.400}',
          inverseColor: '{slate.950}',
          hoverColor: '{indigo.300}',
          activeColor: '{indigo.200}'
        }
      }
    }
  }
});