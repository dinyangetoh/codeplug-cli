export default class ProfileModel {
  constructor(
    public name: string,
    public email: string,
    public age: number,
  ) {}

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getAge(): number {
    return this.age;
  }
}
