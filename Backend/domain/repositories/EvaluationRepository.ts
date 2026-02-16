// Domain repository interface placeholder
export interface EvaluationRepository {
  save(evaluation: any): Promise<any>;
  findById(id: string): Promise<any | null>;
}
