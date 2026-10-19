import { assignCoordination } from './leads.service.js';
import { Coordination } from './lead.enums.js';

describe('assignCoordination', () => {
  it('asigna Colombia a Coordinación Nacional', () => {
    expect(assignCoordination('Colombia')).toBe(Coordination.NACIONAL);
  });

  it('ignora mayúsculas, espacios y tildes', () => {
    expect(assignCoordination('  COLOMBIA ')).toBe(Coordination.NACIONAL);
  });

  it('asigna cualquier otro país a Internacional', () => {
    expect(assignCoordination('México')).toBe(Coordination.INTERNACIONAL);
    expect(assignCoordination('Estados Unidos')).toBe(
      Coordination.INTERNACIONAL,
    );
  });
});
