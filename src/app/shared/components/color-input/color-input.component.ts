import {
  Component,
  computed,
  forwardRef,
  input,
  signal
} from '@angular/core';

import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';

import { ColorPickerModule } from 'primeng/colorpicker';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Sélecteur de couleur hybride : palette PrimeNG + saisie manuelle
 * d'un code hexadécimal.
 *
 * La valeur exposée au formulaire est un hex sur 6 caractères, sans
 * dièse (`6366f1`). Les saisies `#abc`, `abc`, `#aabbcc` et `aabbcc`
 * sont normalisées automatiquement.
 */
@Component({
  selector: 'app-color-input',
  standalone: true,

  imports: [ColorPickerModule, InputTextModule, FormsModule],

  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ColorInputComponent),
      multi: true
    }
  ],

  template: `
    <div class="flex flex-wrap items-center gap-2">
      <p-colorpicker
        [inputId]="inputId()"
        format="hex"
        [ngModel]="value() ?? '6366f1'"
        (ngModelChange)="onPickerChange($event)"
        [disabled]="isDisabled()"
        appendTo="body"
        (onShow)="touch()"
        (onHide)="touch()"
      />

      <div class="relative min-w-[9rem] flex-1">
        <span
          class="pointer-events-none absolute inset-y-0 start-3
                 flex items-center font-mono text-sm app-muted"
          aria-hidden="true"
        >
          #
        </span>

        <input
          pInputText
          type="text"
          class="w-full ps-7 font-mono"
          autocomplete="off"
          spellcheck="false"
          [value]="text()"
          [disabled]="isDisabled()"
          [class.ng-invalid]="invalid()"
          [class.ng-dirty]="invalid()"
          [attr.aria-invalid]="invalid()"
          [attr.aria-label]="inputId()"
          (input)="onTextInput($event)"
          (blur)="onTextBlur()"
        />
      </div>
    </div>
  `
})
export class ColorInputComponent implements ControlValueAccessor {
  readonly inputId = input<string>('');
  readonly disabled = input(false);

  readonly formDisabled = signal(false);
  readonly value = signal<string | null>(null);
  readonly text = signal('');
  readonly invalid = signal(false);

  readonly isDisabled = computed(
    () => this.disabled() || this.formDisabled()
  );

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const normalized = normalizeHex(value);

    this.value.set(normalized);
    this.text.set(normalized ? `#${normalized}` : '');
    this.invalid.set(false);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  touch(): void {
    this.onTouched();
  }

  onPickerChange(value: string): void {
    const normalized = normalizeHex(value);

    if (!normalized) {
      return;
    }

    this.value.set(normalized);
    this.text.set(`#${normalized}`);
    this.invalid.set(false);
    this.onChange(normalized);
  }

  onTextInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const normalized = normalizeHex(raw);

    this.text.set(raw);
    this.invalid.set(normalized === null);

    if (normalized) {
      this.value.set(normalized);
      this.onChange(normalized);
    }
  }

  onTextBlur(): void {
    this.onTouched();

    if (this.invalid()) {
      const current = this.value();

      this.text.set(current ? `#${current}` : '');
      this.invalid.set(false);
      return;
    }

    const normalized = normalizeHex(this.text());

    if (normalized) {
      this.text.set(`#${normalized}`);
    }
  }
}

function normalizeHex(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    return null;
  }

  const hex = match[1].toLowerCase();

  return hex.length === 3
    ? hex
        .split('')
        .map(character => character + character)
        .join('')
    : hex;
}
