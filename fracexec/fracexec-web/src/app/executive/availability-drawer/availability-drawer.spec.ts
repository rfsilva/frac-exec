import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AvailabilityDrawer } from './availability-drawer';

describe('AvailabilityDrawer', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvailabilityDrawer, FormsModule],
    }).compileComponents();
  });

  function create() {
    const fixture = TestBed.createComponent(AvailabilityDrawer);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    return { fixture, comp };
  }

  it('deve criar o componente', () => {
    const { comp } = create();
    expect(comp).toBeTruthy();
  });

  it('ngOnChanges inicializa editDays e editStatus do input', () => {
    const { comp } = create();
    comp.currentDays = 12;
    comp.currentStatus = 'INACTIVE';
    comp.isOpen = true;
    comp.ngOnChanges();
    expect(comp.editDays).toBe(12);
    expect(comp.editStatus).toBe('INACTIVE');
  });

  it('onChanged marca isDirty', () => {
    const { comp } = create();
    expect(comp.isDirty).toBeFalsy();
    comp.onChanged();
    expect(comp.isDirty).toBeTruthy();
  });

  it('onBackdropClick sem dirty emite closed', () => {
    const { comp } = create();
    let closed = false;
    comp.closed.subscribe(() => { closed = true; });
    comp.onBackdropClick();
    expect(closed).toBeTruthy();
  });

  it('onBackdropClick com dirty mostra confirmação', () => {
    const { comp } = create();
    comp.isDirty = true;
    comp.onBackdropClick();
    expect(comp.showConfirm()).toBeTruthy();
  });

  it('onContinueEditing esconde confirmação', () => {
    const { comp } = create();
    comp.isDirty = true;
    comp.onBackdropClick();
    comp.onContinueEditing();
    expect(comp.showConfirm()).toBeFalsy();
  });

  it('onDiscard limpa dirty e emite closed', () => {
    const { comp } = create();
    comp.isDirty = true;
    let closed = false;
    comp.closed.subscribe(() => { closed = true; });
    comp.onDiscard();
    expect(comp.isDirty).toBeFalsy();
    expect(closed).toBeTruthy();
  });

  it('onSave emite saved com dias clampados (min 1)', () => {
    const { comp } = create();
    comp.editDays = 0;
    comp.editStatus = 'ACTIVE';
    let emitted: any = null;
    comp.saved.subscribe(v => { emitted = v; });
    comp.onSave();
    expect(emitted?.availabilityDaysPerMonth).toBe(1);
    expect(emitted?.profileStatus).toBe('ACTIVE');
  });

  it('onSave emite saved com dias clampados (max 20)', () => {
    const { comp } = create();
    comp.editDays = 25;
    comp.editStatus = 'ACTIVE';
    let emitted: any = null;
    comp.saved.subscribe(v => { emitted = v; });
    comp.onSave();
    expect(emitted?.availabilityDaysPerMonth).toBe(20);
  });

  it('onSave não executa novamente se saving=true', () => {
    const { comp } = create();
    comp.saving.set(true);
    let count = 0;
    comp.saved.subscribe(() => count++);
    comp.onSave();
    expect(count).toBe(0);
  });

  it('resetSaving reseta saving para false', () => {
    const { comp } = create();
    comp.saving.set(true);
    comp.resetSaving();
    expect(comp.saving()).toBeFalsy();
  });
});
