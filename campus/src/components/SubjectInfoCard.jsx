function SubjectInfoCard({ subject }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border">
      <div className="flex-1 lg:mb-0 mr-4">
        <h2 className="text-sm font-semibold max-[390px]:text-xs">{subject.name}</h2>
        <p className="text-sm lg:text-base max-[390px]:text-xs">
          {subject.code}
          {subject.isAudit && " • Audit"}
        </p>
        {subject.components.map((component, idx) => (
          <p key={idx} className="text-sm lg:text-base max-[390px]:text-xs">
            {component.type === 'L' && 'Lecture'}
            {component.type === 'T' && 'Tutorial'}
            {component.type === 'P' && 'Practical'}
            : {component.teacher}
          </p>
        ))}
      </div>
      <div className="text-3xl font-bold max-[390px]:text-2xl">
        {subject.credits.toFixed(1)}
      </div>
    </div>
  );
}

export default SubjectInfoCard;